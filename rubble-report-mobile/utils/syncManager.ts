import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { useReportStore } from '../store/reportStore';
import { Alert } from 'react-native';
import { supabase } from './supabase';

const API_URL = 'http://192.168.0.107:3001/api/reports'; // Change this to your backend URL

let unsubscribe: (() => void) | null = null;
let isSyncing = false; // Prevent concurrent syncs
let lastSyncTime = 0; // Debounce sync attempts
const SYNC_DEBOUNCE_MS = 2000; // Minimum 2 seconds between syncs

// Get auth token for API requests
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

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

    // Show results
    if (successCount > 0) {
      console.log(`✅ ${successCount} reports synced successfully`);
      Alert.alert('Sync Complete', `${successCount} reports synced successfully`);
    }

    if (failCount > 0) {
      console.log(`❌ ${failCount} reports failed to sync`);
      Alert.alert('Sync Incomplete', `${failCount} reports could not be synced. Will retry when online.`);
    }

  } catch (error) {
    console.error('Sync error:', error);
    setIsSyncing(false);
    isSyncing = false;
  }
};

const syncSingleReport = async (report: any): Promise<boolean> => {
  let retries = 3;
  let delay = 5000; // Start with 5 seconds

  while (retries > 0) {
    try {
      console.log(`Syncing report ${report.id} (${retries} retries left)...`);

      // Convert image to base64 if it exists
      let imageBase64 = null;
      if (report.imageUri) {
        try {
          imageBase64 = await FileSystem.readAsStringAsync(report.imageUri, {
            encoding: 'base64',
          });
        } catch (imgError) {
          console.error('Error reading image:', imgError);
          // Continue without image rather than failing the whole sync
        }
      }

      // Create payload
      const payload = {
        zone: report.zone,
        category: report.category,
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description,
        imageBase64: imageBase64,
        timestamp: report.timestamp,
      };

      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available, skipping sync');
        return false;
      }

      // Send to backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Report ${report.id} synced successfully`);
        return true;
      } else {
        console.error(`❌ Server responded with status: ${response.status}`);
        throw new Error(`Server error: ${response.status}`);
      }

    } catch (error) {
      console.error(`Sync attempt failed for report ${report.id}:`, error);
      retries--;

      if (retries > 0) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  console.error(`Failed to sync report ${report.id} after 3 attempts`);
  return false;
};

export const stopSyncWatcher = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('Sync watcher stopped');
  }
};
