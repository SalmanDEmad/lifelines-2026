import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PUSH_TOKEN_KEY = 'push-token';

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
        return null;
      }
    } catch (tokenError) {
      console.log('Could not get push token:', tokenError);
      return null;
    }

    console.log('Push token:', token);

    // Save token locally
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }

    // Configure Android channel
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
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to user profile in Supabase
 */
export async function savePushTokenToProfile(userId: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) {
      console.log('No push token found, registering...');
      const newToken = await registerForPushNotifications();
      if (!newToken) return;
    }

    const pushToken = token || await AsyncStorage.getItem(PUSH_TOKEN_KEY);

    // Update user profile with push token
    const { error } = await supabase
      .from('user_profiles')
      .update({ push_token: pushToken })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push token:', error);
    } else {
      console.log('Push token saved to profile');
    }
  } catch (error) {
    console.error('Error saving push token to profile:', error);
  }
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
 * Notify user when report is synced
 */
export async function notifyReportSynced(reportId: string, category: string): Promise<void> {
  await sendLocalNotification(
    'Report Synced ✓',
    `Your ${category} report has been synced successfully.`,
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
  const statusMessages: Record<string, string> = {
    pending: 'Your report is pending review',
    in_progress: 'Your report is being addressed',
    resolved: 'Your report has been resolved! Thank you for helping.',
    rejected: 'Your report could not be verified',
  };

  const message = statusMessages[newStatus] || `Report status: ${newStatus}`;

  await sendLocalNotification(
    'Report Update',
    message,
    { reportId, status: newStatus, type: 'status_change' }
  );
}

/**
 * Notify when offline reports are waiting to sync
 */
export async function notifyPendingReports(count: number): Promise<void> {
  if (count > 0) {
    await sendLocalNotification(
      'Reports Pending',
      `You have ${count} report${count > 1 ? 's' : ''} waiting to sync. Connect to the internet to upload.`,
      { type: 'pending_sync', count }
    );
  }
}
