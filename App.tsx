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
import './global.css';

import SetupScreen from './screens/SetupScreen';
import ReportScreen from './screens/ReportScreen';
import MapScreen from './screens/MapScreen';

import { useReportStore } from './store/reportStore';
import { initDatabase } from './utils/database';
import { useTranslation } from './utils/i18n';
import { RTLProvider } from './context/RTLContext';
import { COLORS, SIZES } from './styles';

type ScreenName = 'Report' | 'Map' | 'Settings';

function AppContent() {
  const [dbReady, setDbReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Report');
  const insets = useSafeAreaInsets();
  const loadReportsFromDB = useReportStore((state) => state.loadReportsFromDB);
  const { t, isLoaded: i18nLoaded } = useTranslation();

  useEffect(() => {
    initializeDatabase();
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
  if (!dbReady || !i18nLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Report':
        return <ReportScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Settings':
        return <SetupScreen />;
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TabButton 
          screen="Report" 
          icon={FileText} 
          label={t('common.report')} 
        />
        <TabButton 
          screen="Map" 
          icon={Map} 
          label={t('common.map')} 
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
        <RTLProvider>
          <AppContent />
        </RTLProvider>
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
