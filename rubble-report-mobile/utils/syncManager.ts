import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { useReportStore } from '../store/reportStore';
import { Alert, AppState } from 'react-native';
import { supabase } from './supabase';
import { notifySyncComplete, notifyReportSynced } from './notifications';
import { uploadPhotoToSupabase } from './photoUpload';

// Note: Sync now goes directly to Supabase instead of backend server

let unsubscribe: (() => void) | null = null;
let isSyncing = false; // Prevent concurrent syncs
let lastSyncTime = 0; // Debounce sync attempts
const SYNC_DEBOUNCE_MS = 2000; // Minimum 2 seconds between syncs

export const startSyncWatcher = () => {
  console.log('Starting sync watcher...');

  // Watch for network connectivity changes
  unsubscribe = NetInfo.addEventListener(state => {
    console.log('Network state changed:', state.isConnected);
    
    if (state.isConnected) {
      // Network is available, attempt sync with debounce
      const now = Date.now();
      if (now - lastSyncTime > SYNC_DEBOUNCE_MS) {
        syncReports();
      }
    }
  });

  // Initial sync attempt if online
  NetInfo.fetch().then(state => {
    if (state.isConnected) {
      syncReports();
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

export const syncReports = async () => {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }

  const { getUnsyncedReports, markSynced, setIsSyncing } = useReportStore.getState();

  try {
    isSyncing = true;
    lastSyncTime = Date.now();
    setIsSyncing(true);
    console.log('Starting sync...');

    const unsyncedReports = await getUnsyncedReports();
    
    if (unsyncedReports.length === 0) {
      console.log('No reports to sync');
      setIsSyncing(false);
      return;
    }

    console.log(`Found ${unsyncedReports.length} reports to sync`);

    let successCount = 0;
    let failCount = 0;

    for (const report of unsyncedReports) {
      const success = await syncSingleReport(report);
      
      if (success) {
        if (report.id) await markSynced(report.id);
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsSyncing(false);
    isSyncing = false;

    // Show results via notification (works when app is in background)
    if (successCount > 0 || failCount > 0) {
      console.log(`[SYNC COMPLETE] Success: ${successCount}, Failed: ${failCount}`);
      
      // Send push notification (device-specific, won't leak to other phones)
      await notifySyncComplete(successCount, failCount);
      
      // Only show alert if app is in foreground
      if (AppState.currentState === 'active') {
        if (failCount === 0) {
          Alert.alert('Sync Complete', `${successCount} report${successCount > 1 ? 's' : ''} synced successfully`);
        } else if (successCount === 0) {
          Alert.alert('Sync Failed', `${failCount} report${failCount > 1 ? 's' : ''} could not be synced. Will retry when online.`);
        } else {
          Alert.alert('Partial Sync', `${successCount} uploaded, ${failCount} failed. Will retry failed reports.`);
        }
      }
    }

  } catch (error) {
    console.error('Sync error:', error);
    setIsSyncing(false);
    isSyncing = false;
  }
};

const syncSingleReport = async (report: any): Promise<boolean> => {
  let retries = 3;
  let delay = 1000; // Start with 1 second for Supabase (faster)

  while (retries > 0) {
    try {
      console.log(`\n[SYNC] Syncing report ${report.id} to Supabase (${retries} retries left)...`);
      console.log(`[SYNC] Report data: zone=${report.zone}, category=${report.category}, lat=${report.latitude}, lng=${report.longitude}`);

      // Try to get authenticated user, but don't require it (allow anonymous submissions)
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      let userId: string | null = null;
      if (session) {
        userId = session.user.id;
        console.log(`[AUTH] ✓ User authenticated: ${userId}`);
      } else {
        console.log(`[AUTH] ℹ Anonymous submission (no user logged in)`);
      }

      // Upload photo if present
      let imageUrl: string | null = null;
      if (report.image_uri) {
        console.log(`[PHOTO] Uploading photo for report ${report.id}...`);
        imageUrl = await uploadPhotoToSupabase(report.image_uri, report.id);
        if (imageUrl) {
          console.log(`[PHOTO] ✓ Photo uploaded: ${imageUrl}`);
        } else {
          console.log(`[PHOTO] ⚠ Photo upload failed, continuing without photo`);
        }
      }

      // Prepare report data - allow submission even without authentication
      // Convert milliseconds timestamp to ISO 8601 format for PostgreSQL
      const timestampISO = new Date(report.timestamp).toISOString();
      
      const syncData: Record<string, any> = {
        zone: report.zone,
        category: report.category,
        subcategory: report.subcategory || null,
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description,
        timestamp: timestampISO, // ISO 8601 format: "2026-01-30T12:34:56.298Z"
        user_id: userId || null, // Can be null for anonymous submissions
        status: 'pending',
      };

      // Add image URL if photo was uploaded
      if (imageUrl) {
        syncData.image_url = imageUrl;
      }

      console.log(`[SYNC] Sending to Supabase:`, JSON.stringify(syncData, null, 2));

      // Insert directly to Supabase (anonymous inserts allowed via RLS policy)
      const { data, error } = await supabase
        .from('reports')
        .insert([syncData]);

      if (error) {
        console.error(`[DB ERROR] Supabase insert failed:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log(`[SUCCESS] ✓ Report ${report.id} synced to Supabase`, { data });
      
      // Send device-specific notification for this report
      await notifyReportSynced(report.id, report.category);
      
      return true;

    } catch (error: any) {
      console.error(`[RETRY] Sync attempt failed for report ${report.id}:`, {
        errorType: error.constructor.name,
        message: error.message,
        code: error.code
      });
      retries--;

      if (retries > 0) {
        console.log(`[RETRY] Retrying in ${delay / 1000} seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  console.error(`[FAILED] ✗ Failed to sync report ${report.id} after 3 attempts - WILL RETRY WHEN ONLINE`);
  return false;
};

export const stopSyncWatcher = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('Sync watcher stopped');
  }
};
