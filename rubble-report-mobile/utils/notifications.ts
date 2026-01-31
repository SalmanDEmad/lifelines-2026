/**
 * ============================================================================
 * NOTIFICATIONS FUNCTIONALITY - DEMO MODE
 * ============================================================================
 * All notification features are stubbed out for the demo.
 * The app functions normally without push notification dependencies.
 * ============================================================================
 */

// Stub out Expo Notifications (not available in all environments)
const Notifications = {
  getPermissionsAsync: async () => ({ status: 'denied' }),
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  getExpoPushTokenAsync: async () => ({ data: null }),
  setNotificationHandler: () => {},
  setBadgeCountAsync: async () => {},
  addNotificationReceivedListener: () => null,
  addNotificationResponseReceivedListener: () => null,
};

// Hazard intensity levels for notification priority
export const HAZARD_INTENSITY = {
  LOW: { radius: 0.5, priority: 'low' },
  MEDIUM: { radius: 1.0, priority: 'normal' },
  HIGH: { radius: 2.0, priority: 'high' },
  CRITICAL: { radius: 5.0, priority: 'max' },
} as const;

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('[DEMO MODE] Push notifications disabled');
  return null;
}

/**
 * Register device for notifications
 */
export async function registerDeviceForNotifications(): Promise<boolean> {
  console.log('[DEMO MODE] Device notifications disabled');
  return false;
}

/**
 * Update device location
 */
export async function updateDeviceLocation(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Subscribe to hazard alerts
 */
export function subscribeToHazardAlerts() {
  console.log('[DEMO MODE] Hazard alerts disabled');
  return null;
}

/**
 * Send hazard proximity alert
 */
export async function sendHazardProximityAlert(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Schedule local notification
 */
export async function scheduleLocalNotification(): Promise<string> {
  return '';
}

/**
 * Send local notification
 */
export async function sendLocalNotification(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Notify sync complete
 */
export async function notifySyncComplete(): Promise<void> {
  console.log('[DEMO MODE] Sync notifications disabled');
}

/**
 * Notify report synced
 */
export async function notifyReportSynced(): Promise<void> {
  console.log('[DEMO MODE] Report sync notifications disabled');
}

/**
 * Notify report status change
 */
export async function notifyReportStatusChange(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Notify pending reports
 */
export async function notifyPendingReports(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return 0;
}

/**
 * Set badge count
 */
export async function setBadgeCount(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener() {
  return null;
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener() {
  return null;
}

/**
 * Check if hazard alerts are enabled
 */
export async function areHazardAlertsEnabled(): Promise<boolean> {
  return false;
}

/**
 * Toggle hazard alerts
 */
export async function toggleHazardAlerts(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Update notification radius
 */
export async function updateNotificationRadius(): Promise<void> {
  // Disabled in demo mode
}

/**
 * Get notification radius
 */
export async function getNotificationRadius(): Promise<number> {
  return 2.0;
}
