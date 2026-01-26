import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Box,
  Text,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Pressable,
} from '../components';
import { MapPin, Globe, RefreshCw, ChevronRight, Info, Shield, Database, LogOut } from 'lucide-react-native';
import { getZoneFromCoords } from '../utils/zones';
import { useTranslation } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADII, SHADOWS, LAYOUT, ICON_SIZES } from '../design';
import { useReportStore } from '../store/reportStore';

const SetupScreen = () => {
  const [zone, setZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { signOut } = useAuth();
  
  const localReports = useReportStore((state) => state.localReports);
  const unsyncedCount = useReportStore((state) => state.unsyncedCount);

  useEffect(() => {
    console.log('SetupScreen mounted');
    checkIfSetup();
  }, []);

  const checkIfSetup = async () => {
    try {
      const savedZone = await AsyncStorage.getItem('userZone');
      if (savedZone) {
        setZone(savedZone);
        setIsSetup(true);
      }
    } catch (error) {
      console.error('Error checking setup:', error);
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
      setIsSetup(true);
    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert(t('setup.error'), t('setup.setupError'), [
        { text: t('setup.tryAgain'), onPress: getLocation },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    Alert.alert(
      t('setup.setupComplete'),
      t('setup.setupCompleteMsg', { zone: zone || '' }),
      [{ text: t('common.gotIt'), onPress: () => {} }]
    );
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    await setLanguage(newLanguage);
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('map.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            console.log('Logout confirmed, calling signOut...');
            try {
              await signOut();
              console.log('SignOut successful');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('auth.error'), t('auth.logoutFailed'));
            }
          },
        },
      ]
    );
  };

  // Reusable Components
  const LanguageToggle = () => (
    <Pressable
      bg={COLORS.surface}
      px={SPACING.md}
      py={SPACING.sm}
      borderRadius={RADII.md}
      minHeight={LAYOUT.minTouchTarget}
      justifyContent="center"
      alignItems="center"
      onPress={toggleLanguage}
      style={SHADOWS.sm}
    >
      <Text fontSize={14} color={COLORS.text} fontWeight="600">
        {language === 'en' ? 'العربية' : 'English'}
      </Text>
    </Pressable>
  );

  const ZoneCard = ({ showAccuracy = false }: { showAccuracy?: boolean }) => (
    <Box
      bg={COLORS.surface}
      borderRadius={RADII.lg}
      p={SPACING.base}
      borderStartWidth={4}
      borderStartColor={COLORS.primary}
      style={SHADOWS.md}
    >
      <Text fontSize={12} color={COLORS.textSecondary} mb={SPACING.xs}>
        {t('setup.zoneLabel')}
      </Text>
      <Text fontSize={20} color={COLORS.primary} fontWeight="700">
        {zone}
      </Text>
      {showAccuracy && accuracy !== null && (
        <Text fontSize={11} color={COLORS.textMuted} mt={SPACING.sm} fontStyle="italic">
          Accuracy: {accuracy} meters
        </Text>
      )}
    </Box>
  );

  const InfoBox = ({ text, variant = 'default' }: { text: string; variant?: 'default' | 'highlight' }) => (
    <Box
      bg={variant === 'highlight' ? '#E3F2FD' : COLORS.surfaceElevated}
      borderRadius={RADII.lg}
      p={SPACING.base}
      borderStartWidth={variant === 'highlight' ? 4 : 0}
      borderStartColor={COLORS.primary}
    >
      <Text fontSize={14} color={COLORS.text} lineHeight={22}>
        {text}
      </Text>
    </Box>
  );

  const PrimaryButton = ({ 
    onPress, 
    label, 
    disabled = false, 
    isLoading = false 
  }: { 
    onPress: () => void; 
    label: string; 
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <Pressable
      bg={disabled ? COLORS.borderDark : COLORS.primary}
      borderRadius={RADII.md}
      py={SPACING.base}
      px={SPACING.xl}
      minHeight={LAYOUT.minTouchTarget}
      justifyContent="center"
      alignItems="center"
      onPress={disabled ? undefined : onPress}
      opacity={disabled ? 0.6 : 1}
      style={SHADOWS.md}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text fontSize={16} color={COLORS.white} fontWeight="600">
          {label}
        </Text>
      )}
    </Pressable>
  );

  const SecondaryButton = ({ onPress, label }: { onPress: () => void; label: string }) => (
    <Pressable
      bg={COLORS.white}
      borderRadius={RADII.md}
      py={SPACING.base}
      px={SPACING.xl}
      minHeight={LAYOUT.minTouchTarget}
      justifyContent="center"
      alignItems="center"
      onPress={onPress}
      borderWidth={1}
      borderColor={COLORS.border}
    >
      <Text fontSize={16} color={COLORS.primary} fontWeight="600">
        {label}
      </Text>
    </Pressable>
  );

  // Setup Complete View
  if (isSetup && zone) {
    return (
      <ScrollView flex={1} bg={COLORS.background}>
        <Box 
          px={LAYOUT.screenPaddingHorizontal} 
          pt={LAYOUT.screenPaddingTop}
          pb={SPACING['3xl']}
        >
          <VStack space="lg">
            {/* Header */}
            <Heading fontSize={24} color={COLORS.text} fontWeight="700">
              {t('common.settings')}
            </Heading>

            {/* Zone Section */}
            <VStack space="xs">
              <Text fontSize={11} color={COLORS.textSecondary} fontWeight="600" textTransform="uppercase">
                {t('setup.zoneLabel')}
              </Text>
              <Pressable
                bg={COLORS.white}
                borderRadius={RADII.lg}
                p={SPACING.base}
                style={SHADOWS.sm}
                onPress={getLocation}
              >
                <HStack space="md">
                  <Box
                    bg={COLORS.primaryLight + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                  >
                    <MapPin size={ICON_SIZES.lg} color={COLORS.primary} />
                  </Box>
                  <VStack flex={1} justifyContent="center">
                    <Text fontSize={16} color={COLORS.text} fontWeight="700">
                      {zone}
                    </Text>
                    <Text fontSize={12} color={COLORS.textSecondary} mt={2}>
                      {t('setup.tapToChange')}
                    </Text>
                  </VStack>
                  <Box justifyContent="center">
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <RefreshCw size={ICON_SIZES.md} color={COLORS.textMuted} />
                    )}
                  </Box>
                </HStack>
              </Pressable>
            </VStack>

            {/* Language Section */}
            <VStack space="xs">
              <Text fontSize={11} color={COLORS.textSecondary} fontWeight="600" textTransform="uppercase">
                {t('setup.language')}
              </Text>
              <Pressable
                bg={COLORS.white}
                borderRadius={RADII.lg}
                p={SPACING.base}
                style={SHADOWS.sm}
                onPress={toggleLanguage}
              >
                <HStack space="md">
                  <Box
                    bg={COLORS.success + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                  >
                    <Globe size={ICON_SIZES.lg} color={COLORS.success} />
                  </Box>
                  <VStack flex={1} justifyContent="center">
                    <Text fontSize={16} color={COLORS.text} fontWeight="600">
                      {language === 'en' ? 'English' : 'العربية'}
                    </Text>
                    <Text fontSize={12} color={COLORS.textSecondary} mt={2}>
                      {language === 'en' ? 'انقر للعربية' : 'Tap for English'}
                    </Text>
                  </VStack>
                  <Box justifyContent="center">
                    <ChevronRight size={ICON_SIZES.md} color={COLORS.textMuted} />
                  </Box>
                </HStack>
              </Pressable>
            </VStack>

            {/* Stats Section - 2x2 Grid */}
            <VStack space="xs">
              <Text fontSize={11} color={COLORS.textSecondary} fontWeight="600" textTransform="uppercase">
                {t('setup.stats')}
              </Text>
              
              {/* Row 1 */}
              <HStack space="sm">
                {/* Total Reports Card */}
                <Box
                  flex={1}
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <Box
                    bg={COLORS.warning + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                    alignSelf="flex-start"
                    mb={SPACING.xs}
                  >
                    <Database size={ICON_SIZES.md} color={COLORS.warning} />
                  </Box>
                  <Text fontSize={11} color={COLORS.textSecondary}>
                    {t('setup.totalReports')}
                  </Text>
                  <Text fontSize={20} color={COLORS.text} fontWeight="700" mt={2}>
                    {localReports.length}
                  </Text>
                </Box>

                {/* Pending Sync Card */}
                <Box
                  flex={1}
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <Box
                    bg={COLORS.offline + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                    alignSelf="flex-start"
                    mb={SPACING.xs}
                  >
                    <RefreshCw size={ICON_SIZES.md} color={COLORS.offline} />
                  </Box>
                  <Text fontSize={11} color={COLORS.textSecondary}>
                    {t('setup.pendingSync')}
                  </Text>
                  <Text fontSize={20} color={COLORS.text} fontWeight="700" mt={2}>
                    {unsyncedCount}
                  </Text>
                </Box>
              </HStack>

              {/* Row 2 */}
              <HStack space="sm">
                {/* Language Card */}
                <Box
                  flex={1}
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <Box
                    bg={COLORS.primary + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                    alignSelf="flex-start"
                    mb={SPACING.xs}
                  >
                    <Globe size={ICON_SIZES.md} color={COLORS.primary} />
                  </Box>
                  <Text fontSize={11} color={COLORS.textSecondary} mb={SPACING.xs}>
                    {t('setup.language')}
                  </Text>
                  <Pressable
                    bg={COLORS.primary + '10'}
                    px={SPACING.sm}
                    py={SPACING.xs}
                    borderRadius={RADII.sm}
                    onPress={toggleLanguage}
                  >
                    <Text fontSize={13} color={COLORS.primary} fontWeight="600" textAlign="center">
                      {language === 'en' ? 'العربية' : 'English'}
                    </Text>
                  </Pressable>
                </Box>

                {/* Logout Card */}
                <Box
                  flex={1}
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <Box
                    bg={COLORS.error + '20'}
                    borderRadius={RADII.md}
                    p={SPACING.sm}
                    alignSelf="flex-start"
                    mb={SPACING.xs}
                  >
                    <LogOut size={ICON_SIZES.md} color={COLORS.error} />
                  </Box>
                  <Text fontSize={11} color={COLORS.textSecondary} mb={SPACING.xs}>
                    {t('auth.account')}
                  </Text>
                  <Pressable
                    bg={COLORS.error + '10'}
                    px={SPACING.sm}
                    py={SPACING.xs}
                    borderRadius={RADII.sm}
                    onPress={handleLogout}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text fontSize={13} color={COLORS.error} fontWeight="600" textAlign="center">
                      {t('auth.logout')}
                    </Text>
                  </Pressable>
                </Box>
              </HStack>
            </VStack>

            {/* About Section */}
            <VStack space="xs">
              <Text fontSize={11} color={COLORS.textSecondary} fontWeight="600" textTransform="uppercase">
                {t('setup.about')}
              </Text>
              <VStack space="sm">
                {/* App Info Card */}
                <Box
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <HStack space="md">
                    <Box
                      bg={COLORS.primary + '20'}
                      borderRadius={RADII.md}
                      p={SPACING.sm}
                    >
                      <Info size={ICON_SIZES.lg} color={COLORS.primary} />
                    </Box>
                    <VStack flex={1} justifyContent="center">
                      <Text fontSize={16} color={COLORS.text} fontWeight="600">
                        Lifelines Gaza
                      </Text>
                      <Text fontSize={12} color={COLORS.textSecondary} mt={2}>
                        {t('setup.version')} 1.0.0
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Offline Feature Card */}
                <Box
                  bg={COLORS.white}
                  borderRadius={RADII.lg}
                  p={SPACING.base}
                  style={SHADOWS.sm}
                >
                  <HStack space="md">
                    <Box
                      bg={COLORS.success + '20'}
                      borderRadius={RADII.md}
                      p={SPACING.sm}
                    >
                      <Shield size={ICON_SIZES.lg} color={COLORS.success} />
                    </Box>
                    <VStack flex={1} justifyContent="center">
                      <Text fontSize={16} color={COLORS.text} fontWeight="600">
                        {t('setup.offlineFirst')}
                      </Text>
                      <Text fontSize={12} color={COLORS.textSecondary} mt={2}>
                        {t('setup.offlineDesc')}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </VStack>

            {/* Info Box */}
            <Box
              bg={'#E3F2FD'}
              borderRadius={RADII.lg}
              p={SPACING.base}
              borderStartWidth={4}
              borderStartColor={COLORS.primary}
            >
              <Text fontSize={13} color={COLORS.text} lineHeight={20}>
                {t('setup.infoText')}
              </Text>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    );
  }

  // Initial Setup View (first time user)
  return (
    <ScrollView flex={1} bg={COLORS.background}>
      <Box 
        px={LAYOUT.screenPaddingHorizontal} 
        pt={SPACING['3xl']}
        pb={SPACING['3xl']}
      >
        <VStack space="xl">
          {/* Hero Icon */}
          <Box justifyContent="center" alignItems="center">
            <Box
              bg={COLORS.primary + '15'}
              borderRadius={RADII.full}
              p={SPACING.xl}
            >
              <MapPin size={64} color={COLORS.primary} />
            </Box>
          </Box>

          {/* Welcome Text */}
          <VStack space="sm">
            <Heading
              fontSize={28}
              color={COLORS.text}
              fontWeight="700"
              textAlign="center"
            >
              {t('setup.welcome')}
            </Heading>
            <Text 
              fontSize={16} 
              color={COLORS.textSecondary} 
              textAlign="center"
              lineHeight={24}
              px={SPACING.base}
            >
              {t('setup.welcomeDesc')}
            </Text>
          </VStack>

          {/* Language Toggle */}
          <Box justifyContent="center" alignItems="center">
            <Pressable
              bg={COLORS.surface}
              px={SPACING.lg}
              py={SPACING.md}
              borderRadius={RADII.lg}
              onPress={toggleLanguage}
              style={SHADOWS.sm}
            >
              <HStack space="sm">
                <Box justifyContent="center">
                  <Globe size={ICON_SIZES.md} color={COLORS.primary} />
                </Box>
                <Box justifyContent="center">
                  <Text fontSize={14} color={COLORS.text} fontWeight="600">
                    {language === 'en' ? 'العربية' : 'English'}
                  </Text>
                </Box>
              </HStack>
            </Pressable>
          </Box>

          {/* Setup Card */}
          <Box 
            bg={COLORS.white}
            borderRadius={RADII.xl}
            p={SPACING.xl}
            w="100%"
            style={SHADOWS.md}
          >
            <VStack space="lg">
              <Text 
                fontSize={16} 
                color={COLORS.text} 
                textAlign="center"
                fontWeight="500"
              >
                {t('setup.detectLocation')}
              </Text>
              
              {zone ? (
                <VStack space="md" w="100%">
                  <Box
                    bg={COLORS.success + '15'}
                    borderRadius={RADII.lg}
                    p={SPACING.base}
                    w="100%"
                  >
                    <VStack space="xs">
                      <Text fontSize={12} color={COLORS.textSecondary} textAlign="center">
                        {t('setup.detectedZone')}
                      </Text>
                      <Text fontSize={24} color={COLORS.success} fontWeight="700" textAlign="center">
                        {zone}
                      </Text>
                      {accuracy !== null && (
                        <Text fontSize={11} color={COLORS.textMuted} textAlign="center">
                          {t('setup.accuracy') || 'Accuracy'}: {accuracy}m
                        </Text>
                      )}
                    </VStack>
                  </Box>
                  <Box justifyContent="center" alignItems="center">
                    <PrimaryButton 
                      onPress={handleContinue} 
                      label={t('setup.getStarted')}
                    />
                  </Box>
                </VStack>
              ) : (
                <Box justifyContent="center" alignItems="center">
                  <PrimaryButton 
                    onPress={getLocation} 
                    label={t('setup.getLocation')}
                    isLoading={loading}
                    disabled={loading}
                  />
                </Box>
              )}
            </VStack>
          </Box>

          {/* Features List */}
          <VStack space="md" w="100%" mt={SPACING.md}>
            <FeatureItem 
              icon={<Shield size={20} color={COLORS.success} />}
              title={t('setup.feature1Title')}
              desc={t('setup.feature1Desc')}
            />
            <FeatureItem 
              icon={<MapPin size={20} color={COLORS.primary} />}
              title={t('setup.feature2Title')}
              desc={t('setup.feature2Desc')}
            />
            <FeatureItem 
              icon={<Database size={20} color={COLORS.warning} />}
              title={t('setup.feature3Title')}
              desc={t('setup.feature3Desc')}
            />
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
};

// Feature item component
const FeatureItem = ({ 
  icon, 
  title, 
  desc 
}: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string;
}) => (
  <HStack space="md" bg={COLORS.surface} p={SPACING.md} borderRadius={RADII.lg}>
    <Box justifyContent="center">
      <Box
        bg={COLORS.white}
        borderRadius={RADII.md}
        p={SPACING.sm}
      >
        {icon}
      </Box>
    </Box>
    <VStack flex={1} justifyContent="center">
      <Text fontSize={14} color={COLORS.text} fontWeight="600">
        {title}
      </Text>
      <Text fontSize={12} color={COLORS.textSecondary}>
        {desc}
      </Text>
    </VStack>
  </HStack>
);

export default SetupScreen;
