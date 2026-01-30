import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PUSH_TOKEN_KEY = 'push-token';
const DEVICE_ID_KEY = 'device-id';

// Hazard intensity levels for notification priority
export const HAZARD_INTENSITY = {
  LOW: { radius: 0.5, priority: 'low' },      // 0.5 miles
  MEDIUM: { radius: 1.0, priority: 'normal' }, // 1 mile
  HIGH: { radius: 2.0, priority: 'high' },     // 2 miles
  CRITICAL: { radius: 5.0, priority: 'max' },  // 5 miles
} as const;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Generate a unique device ID
 */
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if physical device (required for push)
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get push token - handle missing projectId gracefully
    let token: string | null = null;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (projectId) {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        token = tokenData.data;
      } else {
        // In Expo Go without EAS, we can still use local notifications
        console.log('No projectId found - push notifications disabled, local notifications still work');
        // Generate a fake token for local notification tracking
        token = `local_${await getOrCreateDeviceId()}`;
      }
    } catch (tokenError) {
      console.log('Could not get push token:', tokenError);
      // Generate a fake token for local notification tracking
      token = `local_${await getOrCreateDeviceId()}`;
    }

    console.log('Push token:', token);

    // Save token locally
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }

    // Configure Android channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('reports', {
        name: 'Report Updates',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications about your report status',
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('hazards', {
        name: 'Hazard Alerts',
        importance: Notifications.AndroidImportance.MAX,
        description: 'Critical alerts about nearby hazards',
        vibrationPattern: [0, 500, 200, 500],
        enableVibrate: true,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('sync', {
        name: 'Sync Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Notifications when reports are synced',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Register device token in Supabase for push notifications
 * This is specific to THIS device only - won't leak to others
 */
export async function registerDeviceForNotifications(
  region: string,
  latitude?: number,
  longitude?: number,
  radiusMiles: number = 2.0
): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) {
      console.log('No push token found');
      return false;
    }

    const deviceId = await getOrCreateDeviceId();

    // Upsert device token in Supabase (update if exists, insert if not)
    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        push_token: token,
        device_id: deviceId,
        platform: Platform.OS,
        region: region,
        latitude: latitude,
        longitude: longitude,
        notification_radius_miles: radiusMiles,
        hazard_alerts_enabled: true,
        sync_alerts_enabled: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'push_token',
      });

    if (error) {
      console.error('Error registering device token:', error);
      return false;
    }

    console.log('Device registered for notifications:', { deviceId, region, radiusMiles });
    return true;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
}

/**
 * Update device location for proximity alerts
 */
export async function updateDeviceLocation(
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    const { error } = await supabase
      .from('device_tokens')
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('push_token', token);

    if (error) {
      console.error('Error updating device location:', error);
    }
  } catch (error) {
    console.error('Error updating location:', error);
  }
}

/**
 * Subscribe to realtime hazard notifications
 * This listens for new hazards and alerts user if within radius
 */
export function subscribeToHazardAlerts(
  userLatitude: number,
  userLongitude: number,
  radiusMiles: number = 2.0,
  onHazardNearby?: (hazard: any, distance: number) => void
) {
  console.log('Subscribing to hazard alerts...');
  
  const subscription = supabase
    .channel('hazard-alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
        filter: 'category=eq.hazard',
      },
      async (payload) => {
        const newHazard = payload.new;
        console.log('New hazard reported:', newHazard);

        // Calculate distance from user
        const distance = calculateDistanceMiles(
          userLatitude,
          userLongitude,
          newHazard.latitude,
          newHazard.longitude
        );

        console.log(`Hazard distance: ${distance.toFixed(2)} miles`);

        // Check if within notification radius
        if (distance <= radiusMiles) {
          // Determine intensity based on subcategory
          const intensity = getHazardIntensity(newHazard.subcategory);
          
          // Send local notification (works in Expo Go!)
          await sendHazardProximityAlert(newHazard, distance, intensity);

          // Callback for UI updates
          if (onHazardNearby) {
            onHazardNearby(newHazard, distance);
          }
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Calculate distance between two coordinates in miles
 */
function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get hazard intensity based on subcategory
 */
function getHazardIntensity(subcategory?: string): keyof typeof HAZARD_INTENSITY {
  switch (subcategory) {
    case 'unexploded_ordnance':
    case 'chemical_gas':
      return 'CRITICAL';
    case 'structural_risk':
    case 'electrical':
      return 'HIGH';
    case 'contaminated_water':
      return 'MEDIUM';
    case 'medical_emergency':
      return 'HIGH';
    default:
      return 'MEDIUM';
  }
}

/**
 * Send hazard proximity alert notification
 */
export async function sendHazardProximityAlert(
  hazard: any,
  distanceMiles: number,
  intensity: keyof typeof HAZARD_INTENSITY
): Promise<void> {
  const intensityInfo = HAZARD_INTENSITY[intensity];
  const distanceText = distanceMiles < 1 
    ? `${Math.round(distanceMiles * 5280)} feet` 
    : `${distanceMiles.toFixed(1)} miles`;

  const subcategoryLabels: Record<string, string> = {
    unexploded_ordnance: '⚠️ UXO/Explosive',
    structural_risk: '🏚️ Structural Collapse Risk',
    electrical: '⚡ Electrical Hazard',
    chemical_gas: '☢️ Chemical/Gas Hazard',
    contaminated_water: '💧 Contaminated Water',
    medical_emergency: '🚑 Medical Emergency',
  };

  const hazardLabel = subcategoryLabels[hazard.subcategory] || '⚠️ Hazard';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 ${hazardLabel} Nearby!`,
      body: `${distanceText} away: ${hazard.description || 'A hazard has been reported near your location'}`,
      data: { 
        type: 'hazard_alert',
        reportId: hazard.id,
        latitude: hazard.latitude,
        longitude: hazard.longitude,
        distance: distanceMiles,
        intensity,
      },
      sound: true,
      priority: intensityInfo.priority === 'max' 
        ? Notifications.AndroidNotificationPriority.MAX 
        : Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'hazards',
    },
    trigger: null, // Immediate
  });
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  seconds: number = 1
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  return id;
}

/**
 * Send immediate local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // null trigger = immediate
  });
}

/**
 * Notify user when reports are synced - DEVICE SPECIFIC
 * This only shows on THIS device, not others
 */
export async function notifySyncComplete(
  successCount: number,
  failCount: number
): Promise<void> {
  if (successCount === 0 && failCount === 0) return;

  let title = '';
  let body = '';

  if (failCount === 0) {
    title = '✅ Sync Complete';
    body = `${successCount} report${successCount > 1 ? 's' : ''} uploaded successfully.`;
  } else if (successCount === 0) {
    title = '⚠️ Sync Failed';
    body = `${failCount} report${failCount > 1 ? 's' : ''} could not be uploaded. Will retry when online.`;
  } else {
    title = '⚡ Partial Sync';
    body = `${successCount} uploaded, ${failCount} failed. Will retry failed reports.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'sync_complete', successCount, failCount },
      sound: true,
      categoryIdentifier: 'sync',
    },
    trigger: null,
  });
}

/**
 * Notify user when a specific report is synced
 */
export async function notifyReportSynced(reportId: string, category: string): Promise<void> {
  const categoryLabels: Record<string, string> = {
    rubble: '🧱 Rubble',
    hazard: '⚠️ Hazard',
    blocked_road: '🚧 Blocked Road',
  };

  await sendLocalNotification(
    'Report Synced ✓',
    `Your ${categoryLabels[category] || category} report has been uploaded.`,
    { reportId, type: 'report_synced' }
  );
}

/**
 * Notify user when report status changes
 */
export async function notifyReportStatusChange(
  reportId: string,
  newStatus: string
): Promise<void> {
  const statusMessages: Record<string, { emoji: string; message: string }> = {
    pending: { emoji: '⏳', message: 'Your report is pending review' },
    in_progress: { emoji: '🔧', message: 'Your report is being addressed by a team' },
    resolved: { emoji: '✅', message: 'Your report has been resolved! Thank you for helping.' },
    rejected: { emoji: '❌', message: 'Your report could not be verified' },
  };

  const status = statusMessages[newStatus] || { emoji: '📋', message: `Report status: ${newStatus}` };

  await sendLocalNotification(
    `${status.emoji} Report Update`,
    status.message,
    { reportId, status: newStatus, type: 'status_change' }
  );
}

/**
 * Notify when offline reports are waiting to sync
 */
export async function notifyPendingReports(count: number): Promise<void> {
  if (count > 0) {
    await sendLocalNotification(
      '📤 Reports Pending',
      `You have ${count} report${count > 1 ? 's' : ''} waiting to sync. Connect to the internet to upload.`,
      { type: 'pending_sync', count }
    );
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add notification listener
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Check if hazard notifications are enabled
 */
export async function areHazardAlertsEnabled(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return false;

    const { data, error } = await supabase
      .from('device_tokens')
      .select('hazard_alerts_enabled')
      .eq('push_token', token)
      .single();

    if (error) return true; // Default to enabled
    return data?.hazard_alerts_enabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Toggle hazard alerts for this device
 */
export async function toggleHazardAlerts(enabled: boolean): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    await supabase
      .from('device_tokens')
      .update({ hazard_alerts_enabled: enabled })
      .eq('push_token', token);
  } catch (error) {
    console.error('Error toggling hazard alerts:', error);
  }
}

/**
 * Update notification radius for this device
 */
export async function updateNotificationRadius(radiusMiles: number): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    await supabase
      .from('device_tokens')
      .update({ notification_radius_miles: radiusMiles })
      .eq('push_token', token);

    await AsyncStorage.setItem('notification_radius', radiusMiles.toString());
  } catch (error) {
    console.error('Error updating notification radius:', error);
  }
}

/**
 * Get current notification radius
 */
export async function getNotificationRadius(): Promise<number> {
  const radius = await AsyncStorage.getItem('notification_radius');
  return radius ? parseFloat(radius) : 2.0;
}
