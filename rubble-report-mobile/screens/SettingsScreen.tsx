import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MapPin, Globe, RefreshCw, Info, Shield, Database, LogOut } from 'lucide-react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getZoneFromCoords } from '../utils/zones';
import { useTranslation } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../styles';
import { useReportStore } from '../store/reportStore';

const SettingsScreen = () => {
  const [zone, setZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { signOut } = useAuth();
  
  const localReports = useReportStore((state) => state.localReports);
  const unsyncedCount = useReportStore((state) => state.unsyncedCount);

  useEffect(() => {
    checkZone();
  }, []);

  const checkZone = async () => {
    try {
      const savedZone = await AsyncStorage.getItem('userZone');
      if (savedZone) {
        setZone(savedZone);
      }
    } catch (error) {
      console.error('Error checking zone:', error);
    }
  };

  const getLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('setup.permissionDenied'),
          t('setup.locationRequired'),
          [{ text: t('setup.tryAgain'), onPress: getLocation }]
        );
        setLoading(false);
        return;
      }

      let latitude, longitude, locationAccuracy;
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        locationAccuracy = location.coords.accuracy;
      } catch (locationError) {
        console.log('Location fetch failed, using Gaza City default');
        latitude = 31.52;
        longitude = 34.48;
        locationAccuracy = null;
      }

      setAccuracy(Math.round(locationAccuracy || 0));
      const detectedZone = getZoneFromCoords(latitude, longitude);
      setZone(detectedZone);
      await AsyncStorage.setItem('userZone', detectedZone);
    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert(t('setup.error'), t('setup.setupError'), [
        { text: t('setup.tryAgain'), onPress: getLocation },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    await setLanguage(newLanguage);
  };

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('auth.error'), t('auth.logoutFailed'));
            }
          },
        },
      ]
    );
  };

  const handleGoToOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_complete');
      await AsyncStorage.removeItem('userZone');
      await AsyncStorage.removeItem('user_zone');
      await AsyncStorage.removeItem('selected_region');
      setZone(null);
      Alert.alert('Reset Complete', 'Please restart the app to go through onboarding again.');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert(t('auth.error'), 'Failed to reset setup');
    }
  };

  // Debug function to show current storage values
  const handleDebugStorage = async () => {
    try {
      const region = await AsyncStorage.getItem('selected_region');
      const userZone = await AsyncStorage.getItem('user_zone');
      const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
      
      Alert.alert(
        'Debug: Storage Values',
        `selected_region: ${region || '(not set)'}\n` +
        `user_zone: ${userZone || '(not set)'}\n` +
        `onboarding_complete: ${onboardingComplete || '(not set)'}`
      );
    } catch (error) {
      console.error('Error reading storage:', error);
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
      {title}
    </Text>
  );

  const SettingCard = ({
    icon: IconComponent,
    label,
    value,
    onPress,
    isLoading = false,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value?: string;
    onPress?: () => void;
    isLoading?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingCard, isRTL && { flexDirection: 'row-reverse' }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
        <IconComponent size={20} color={COLORS.primary} />
      </View>
      <View style={[styles.cardContent, isRTL && { marginRight: 12, marginLeft: 0 }]}>
        <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>
          {label}
        </Text>
        <Text style={[styles.cardValue, isRTL && { textAlign: 'right' }]}>
          {value || 'Not Set'}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <RefreshCw size={18} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({
    icon: IconComponent,
    label,
    value,
    color,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View style={[styles.statCard, isRTL && { flexDirection: 'row-reverse' }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <IconComponent size={18} color={color} />
      </View>
      <View style={[styles.statContent, isRTL && { marginRight: 12, marginLeft: 0 }]}>
        <Text style={[styles.statLabel, isRTL && { textAlign: 'right' }]}>
          {label}
        </Text>
        <Text style={[styles.statValue, isRTL && { textAlign: 'right' }]}>
          {value}
        </Text>
      </View>
    </View>
  );

  const InfoBox = ({ text }: { text: string }) => (
    <View style={[styles.infoBox, isRTL && { flexDirection: 'row-reverse' }]}>
      <Info size={18} color={COLORS.primary} style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
      <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isRTL && { direction: 'rtl' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.header, isRTL && { textAlign: 'right' }]}>
          {t('common.settings')}
        </Text>

        {/* Zone & Language Section */}
        <SectionTitle title="Configuration" />
        <View style={styles.sectionContainer}>
          <SettingCard
            icon={MapPin}
            label={t('setup.zoneLabel')}
            value={zone || undefined}
            onPress={getLocation}
            isLoading={loading}
          />
          <View style={styles.divider} />
          <SettingCard
            icon={Globe}
            label={t('setup.language')}
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={toggleLanguage}
          />
        </View>

        {/* Stats Section */}
        <SectionTitle title={t('setup.stats')} />
        <View style={styles.statsGrid}>
          <StatCard
            icon={Database}
            label={t('setup.totalReports')}
            value={localReports.length}
            color={COLORS.warning}
          />
          <StatCard
            icon={RefreshCw}
            label={t('setup.pendingSync')}
            value={unsyncedCount}
            color={COLORS.offline}
          />
        </View>

        {/* About Section */}
        <SectionTitle title={t('setup.about')} />
        <View style={styles.sectionContainer}>
          <View style={[styles.aboutCard, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Info size={20} color={COLORS.primary} />
            </View>
            <View style={[styles.cardContent, isRTL && { marginRight: 12, marginLeft: 0 }]}>
              <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>
                Amal Gaza
              </Text>
              <Text style={[styles.cardValue, isRTL && { textAlign: 'right' }]}>
                {t('setup.version')} 1.0.0
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.aboutCard, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
              <Shield size={20} color={COLORS.success} />
            </View>
            <View style={[styles.cardContent, isRTL && { marginRight: 12, marginLeft: 0 }]}>
              <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>
                {t('setup.offlineFirst')}
              </Text>
              <Text style={[styles.cardValue, isRTL && { textAlign: 'right' }]}>
                {t('setup.offlineDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <InfoBox text={t('setup.infoText')} />

        {/* Action Buttons */}
        <SectionTitle title="Actions" />
        
        {/* Onboarding Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoToOnboarding}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {t('setup.startOver') || 'Start Over'}
          </Text>
        </TouchableOpacity>

        {/* Debug Button - for development */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#6B7280', marginTop: 12 }]}
          onPress={handleDebugStorage}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            Debug: Show Storage Values
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#D32F2F" />
          <Text style={styles.logoutText}>
            {t('auth.logout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding_large,
    paddingBottom: SIZES.padding_large * 2,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.padding_large,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginTop: SIZES.padding_large,
    marginBottom: SIZES.padding,
    letterSpacing: 0.8,
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SIZES.padding_large,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  cardContent: {
    flex: 1,
    marginLeft: SIZES.padding_small,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SIZES.padding_small,
    marginBottom: SIZES.padding_large,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.padding,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding_small,
  },
  statContent: {
    flex: 1,
    marginLeft: SIZES.padding_small,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    marginVertical: SIZES.padding_large,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    flex: 1,
    marginLeft: SIZES.padding,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D32F2F',
    marginLeft: 8,
  },
});

export default SettingsScreen;
