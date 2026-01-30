import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { FileText, Map, Settings } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './global.css';

import SetupScreen from './screens/SetupScreen';
import ReportScreen from './screens/ReportScreen';
import MapScreen from './screens/MapScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SettingsScreen from './screens/SettingsScreen';

import { useReportStore } from './store/reportStore';
import { initDatabase } from './utils/database';
import { useTranslation, TranslationProvider } from './utils/i18n';
import { RTLProvider } from './context/RTLContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { COLORS, SIZES } from './styles';
import { startSyncWatcher, stopSyncWatcher } from './utils/syncManager';
import { 
  registerForPushNotifications, 
  savePushTokenToProfile,
  addNotificationReceivedListener,
  addNotificationResponseListener 
} from './utils/notifications';

type ScreenName = 'Report' | 'Map' | 'Settings';
type AuthScreen = 'Login' | 'Signup';

function AppContent() {
  const [dbReady, setDbReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Report');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('Login');
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();
  const loadReportsFromDB = useReportStore((state) => state.loadReportsFromDB);
  const { t, isLoaded: i18nLoaded, isRTL } = useTranslation();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    initializeDatabase();
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const complete = await AsyncStorage.getItem('onboarding_complete');
      setOnboardingComplete(complete === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(true); // Default to complete if error
    }
  };

  useEffect(() => {
    // Start sync watcher when app loads
    const cleanup = startSyncWatcher();
    
    return () => {
      cleanup();
      stopSyncWatcher();
    };
  }, []);

  // Register for push notifications when user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      // Register for push notifications and save token to profile
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushTokenToProfile(session.user.id);
        }
      });
    }
  }, [session?.user?.id]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    const notificationReceivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on a notification
    const notificationResponseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification type
      if (data?.type === 'report_synced' || data?.type === 'status_change') {
        setCurrentScreen('Map');
      }
    });

    return () => {
      notificationReceivedSubscription.remove();
      notificationResponseSubscription.remove();
    };
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('Starting database initialization...');
      await initDatabase();
      console.log('Database initialized, loading reports...');
      await loadReportsFromDB();
      console.log('Reports loaded, ready to go');
      setDbReady(true);
    } catch (error) {
      console.error('Database initialization error:', error);
      setDbReady(true);
    }
  };
  if (!dbReady || !i18nLoaded || authLoading || onboardingComplete === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show onboarding for first-time users
  if (!onboardingComplete) {
    return (
      <OnboardingScreen 
        onComplete={() => setOnboardingComplete(true)} 
      />
    );
  }

  // App works without login - onboarding complete, show main app
  // If user has session, they're logged in; otherwise they use app anonymously

  // Auth screens removed - app works without login
  // Users can optionally sign up later in settings

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Report':
        return <ReportScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <ReportScreen />;
    }
  };

  const TabButton = ({ 
    screen, 
    icon: IconComponent, 
    label 
  }: { 
    screen: ScreenName; 
    icon: React.ComponentType<{ size: number; color: string }>; 
    label: string;
  }) => {
    const isActive = currentScreen === screen;
    const color = isActive ? COLORS.primary : '#9CA3AF';
    
    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setCurrentScreen(screen)}
        activeOpacity={0.7}
      >
        <IconComponent size={22} color={color} />
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {label}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, direction: isRTL ? 'rtl' : 'ltr' } as any]}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8), flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TabButton 
          screen="Report" 
          icon={FileText} 
          label={t('common.report')} 
        />
        <TabButton 
          screen="Map" 
          icon={Map} 
          label="Map" 
        />
        <TabButton 
          screen="Settings" 
          icon={Settings} 
          label={t('common.settings')} 
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <TranslationProvider>
          <RTLProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </RTLProvider>
        </TranslationProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
