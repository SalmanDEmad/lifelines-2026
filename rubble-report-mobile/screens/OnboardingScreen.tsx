import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, VStack, HStack, Heading, Pressable } from '../components';
import { 
  Globe, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Download, 
  Wifi, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  Circle,
  Info,
  Navigation
} from 'lucide-react-native';
import { useTranslation, Language } from '../utils/i18n';
import { COLORS, SPACING, RADII, SHADOWS } from '../design';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REGIONS, getZonesByRegion } from '../utils/zones';
import { downloadRegionTiles, getRegionCacheStatus, formatBytes } from '../utils/offlineMapCache';
import { registerDeviceForNotifications, registerForPushNotifications } from '../utils/notifications';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingStep = 'language' | 'intro' | 'region' | 'location' | 'download' | 'sync';

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncWithPhotos, setSyncWithPhotos] = useState(true);
  
  const insets = useSafeAreaInsets();
  const { t, setLanguage, isRTL } = useTranslation();

  const steps: OnboardingStep[] = ['language', 'intro', 'region', 'location', 'download', 'sync'];
  const currentIndex = steps.indexOf(currentStep);

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    await setLanguage(lang);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    // DEMO: Using dummy data
    // TODO: Uncomment for real implementation
    /*
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        // Determine zone based on coordinates
        const zone = getZoneFromCoordinates(location.coords.latitude, location.coords.longitude);
        setDetectedZone(zone);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
    */
    
    // DEMO: Simulate location detection
    // Pick a random zone from the selected region
    const regionZones = getZonesByRegion(selectedRegion || 'palestine');
    const randomZone = regionZones[Math.floor(Math.random() * regionZones.length)];
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDetectedZone(randomZone?.name || 'Unknown');
    setIsDetectingLocation(false);
  };

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  const handleDownloadMap = async () => {
    if (!selectedRegion) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadMessage('Starting download...');
    
    // Register for push notifications first
    await registerForPushNotifications();
    
    // Download map tiles for the selected region
    const result = await downloadRegionTiles(
      selectedRegion,
      (progress, message) => {
        setDownloadProgress(progress);
        setDownloadMessage(message);
      }
    );
    
    if (result.success) {
      // Register device for hazard proximity notifications
      const region = REGIONS[selectedRegion as keyof typeof REGIONS] || REGIONS.palestine;
      if (region?.center) {
        await registerDeviceForNotifications(
          selectedRegion,
          region.center.latitude,
          region.center.longitude,
          2.0 // 2 mile notification radius
        );
      }
      
      setDownloadComplete(true);
      setDownloadMessage(`Downloaded ${result.tilesDownloaded} tiles (${formatBytes(result.sizeBytes)})`);
    } else {
      setDownloadMessage('Download failed. You can continue without offline maps.');
      // Allow continuing even if download failed
      setDownloadComplete(true);
    }
    
    setIsDownloading(false);
  };

  const handleComplete = async () => {
    // Save onboarding preferences
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('auto_sync', autoSync ? 'true' : 'false');
    await AsyncStorage.setItem('sync_with_photos', syncWithPhotos ? 'true' : 'false');
    await AsyncStorage.setItem('user_zone', detectedZone || 'Unknown');
    await AsyncStorage.setItem('selected_region', selectedRegion || 'palestine');
    
    onComplete();
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'language': return true;
      case 'intro': return true;
      case 'region': return selectedRegion !== null;
      case 'location': return detectedZone !== null;
      case 'download': return downloadComplete;
      case 'sync': return true;
      default: return false;
    }
  };

  // Progress indicator
  const ProgressDots = () => (
    <HStack space="sm" justifyContent="center" py={SPACING.md}>
      {steps.map((step, index) => (
        <View
          key={step}
          style={[
            styles.progressDot,
            index === currentIndex && styles.progressDotActive,
            index < currentIndex && styles.progressDotComplete
          ]}
        />
      ))}
    </HStack>
  );

  // Language Selection Step
  const LanguageStep = () => (
    <VStack flex={1} justifyContent="center" alignItems="center" space="xl" px={SPACING.xl}>
      <Globe size={64} color={COLORS.primary} />
      <Heading fontSize={28} color={COLORS.text} textAlign="center">
        Select Language
      </Heading>
      <Text fontSize={16} color={COLORS.textSecondary} textAlign="center">
        اختر لغتك
      </Text>
      
      <VStack space="md" w="100%" mt={SPACING.xl}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            selectedLanguage === 'en' && styles.languageButtonActive
          ]}
          onPress={() => handleLanguageSelect('en')}
        >
          <Text fontSize={18} fontWeight="600" color={selectedLanguage === 'en' ? COLORS.white : COLORS.text}>
            English
          </Text>
          {selectedLanguage === 'en' && <CheckCircle size={24} color={COLORS.white} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageButton,
            selectedLanguage === 'ar' && styles.languageButtonActive
          ]}
          onPress={() => handleLanguageSelect('ar')}
        >
          <Text fontSize={18} fontWeight="600" color={selectedLanguage === 'ar' ? COLORS.white : COLORS.text}>
            العربية
          </Text>
          {selectedLanguage === 'ar' && <CheckCircle size={24} color={COLORS.white} />}
        </TouchableOpacity>
      </VStack>
    </VStack>
  );

  // Introduction Step - Redesigned to match reference
  const IntroStep = () => (
    <View style={styles.introContainer}>
      {/* Skip button */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleComplete}
      >
        <Text fontSize={16} fontWeight="600" color={COLORS.textSecondary}>
          {t('common.skip') || 'Skip'}
        </Text>
      </TouchableOpacity>

      {/* Hero illustration area */}
      <View style={styles.heroSection}>
        <View style={styles.heroGradient}>
          {/* Logo and branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>أ</Text>
            </View>
            <Text style={styles.logoTitle}>Amal أمل</Text>
            <Text style={styles.logoSubtitle}>Mapping Gaza's Debris</Text>
          </View>
          {/* Map pin illustration */}
          <View style={styles.mapPinContainer}>
            <MapPin size={60} color={COLORS.primary} />
          </View>
          {/* Phone with map illustration */}
          <View style={styles.phoneIllustration}>
            <View style={styles.phoneFrame}>
              <Navigation size={28} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </View>

      {/* White card section */}
      <View style={styles.introCard}>
        {/* Feature cards in horizontal row */}
        <View style={styles.featureRow}>
          {/* Feature 1: Create Report */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Camera size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.featureTitle}>
              {t('onboarding.feature1') || 'Create report:'}
            </Text>
            <Text style={styles.featureDesc}>
              {t('onboarding.feature1Desc') || 'Mark Rubble, or hazards'}
            </Text>
          </View>

          {/* Feature 2: See hazards */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <AlertTriangle size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.featureTitle}>
              {t('onboarding.feature2') || 'See nearby hazards:'}
            </Text>
            <Text style={styles.featureDesc}>
              {t('onboarding.feature2Desc') || 'View community reported dangers'}
            </Text>
          </View>

          {/* Feature 3: Share */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.success + '15' }]}>
              <MapPin size={24} color={COLORS.success} />
            </View>
            <Text style={styles.featureTitle}>
              {t('onboarding.feature3') || 'Share with centrals:'}
            </Text>
            <Text style={styles.featureDesc}>
              {t('onboarding.feature3Desc') || 'Help neighbors find safe paths'}
            </Text>
          </View>
        </View>

        {/* Get Started button */}
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={goNext}
        >
          <Text style={styles.getStartedText}>
            {t('common.getStarted') || 'Get started!'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Region Selection Step
  const RegionStep = () => {
    const regions = Object.entries(REGIONS);
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <VStack flex={1} alignItems="center" space="lg" px={SPACING.xl}>
          <Globe size={64} color={COLORS.primary} />
          <Heading fontSize={24} color={COLORS.text} textAlign="center">
            {t('onboarding.selectRegion') || 'Select Your Region'}
          </Heading>
          <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
            {t('onboarding.selectRegionDesc') || 'Choose the region where you are located'}
          </Text>
          
          <VStack space="md" w="100%" mt={SPACING.lg}>
            {regions.map(([key, region]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.regionButton,
                  selectedRegion === key && styles.regionButtonActive
                ]}
                onPress={() => setSelectedRegion(key)}
              >
                <HStack flex={1} alignItems="center" space="md">
                  <Image
                    source={{ uri: region.flagUrl }}
                    style={{ width: 32, height: 32 }}
                  />
                  <VStack flex={1}>
                    <Text 
                      style={{ 
                        fontSize: 18, 
                        fontWeight: '600', 
                        color: selectedRegion === key ? '#FFFFFF' : COLORS.text 
                      }}
                    >
                      {selectedLanguage === 'ar' ? region.nameAr : region.name}
                    </Text>
                    <Text 
                      style={{ 
                        fontSize: 14, 
                        color: selectedRegion === key ? 'rgba(255,255,255,0.8)' : COLORS.textSecondary 
                      }}
                    >
                      {getZonesByRegion(key).length} {t('onboarding.zones') || 'zones'}
                    </Text>
                  </VStack>
                  {selectedRegion === key && <CheckCircle size={24} color="#FFFFFF" />}
                </HStack>
              </TouchableOpacity>
            ))}
          </VStack>
        </VStack>
      </ScrollView>
    );
  };

  // Location Detection Step
  const LocationStep = () => (
    <VStack flex={1} justifyContent="center" alignItems="center" space="xl" px={SPACING.xl}>
      <Navigation size={64} color={COLORS.primary} />
      <Heading fontSize={24} color={COLORS.text} textAlign="center">
        {t('onboarding.detectZone') || 'Detect Your Zone'}
      </Heading>
      <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
        {t('onboarding.detectZoneDesc') || 'We need to know your location to download the right map for your area.'}
      </Text>
      
      {detectedZone ? (
        <VStack alignItems="center" space="md" mt={SPACING.lg}>
          <Box bg={COLORS.success + '20'} p={SPACING.lg} borderRadius={100}>
            <CheckCircle size={48} color={COLORS.success} />
          </Box>
          <Text fontSize={14} color={COLORS.textSecondary}>
            {t('onboarding.zoneDetected') || 'Zone Detected'}
          </Text>
          <Text fontSize={20} fontWeight="700" color={COLORS.text}>
            {detectedZone}
          </Text>
        </VStack>
      ) : (
        <TouchableOpacity
          style={styles.detectButton}
          onPress={handleDetectLocation}
          disabled={isDetectingLocation}
        >
          {isDetectingLocation ? (
            <Text fontSize={16} fontWeight="600" color={COLORS.white}>
              {t('onboarding.detecting') || 'Detecting...'}
            </Text>
          ) : (
            <>
              <MapPin size={20} color={COLORS.white} />
              <Text fontSize={16} fontWeight="600" color={COLORS.white}>
                {t('onboarding.detectLocation') || 'Detect My Location'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </VStack>
  );

  // Map Download Step
  const DownloadStep = () => (
    <VStack flex={1} justifyContent="center" alignItems="center" space="xl" px={SPACING.xl}>
      <Download size={64} color={COLORS.primary} />
      <Heading fontSize={24} color={COLORS.text} textAlign="center">
        {t('onboarding.downloadMap') || 'Download Zone Map'}
      </Heading>
      <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
        {t('onboarding.downloadMapDesc') || 'Download a detailed map of your zone for offline use.'}
      </Text>
      
      <Box bg={COLORS.surface} p={SPACING.lg} borderRadius={RADII.lg} w="100%">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text fontWeight="600" color={COLORS.text}>{detectedZone}</Text>
            <Text fontSize={13} color={COLORS.textSecondary}>
              {downloadComplete ? '~2.5 MB downloaded' : '~2.5 MB'}
            </Text>
          </VStack>
          {downloadComplete && <CheckCircle size={24} color={COLORS.success} />}
        </HStack>
      </Box>
      
      {downloadComplete ? (
        <VStack alignItems="center" space="sm">
          <CheckCircle size={48} color={COLORS.success} />
          <Text fontSize={16} fontWeight="600" color={COLORS.success}>
            {t('onboarding.downloadComplete') || 'Download Complete!'}
          </Text>
        </VStack>
      ) : (
        <TouchableOpacity
          style={styles.detectButton}
          onPress={handleDownloadMap}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Text fontSize={16} fontWeight="600" color={COLORS.white}>
              {t('onboarding.downloading') || 'Downloading...'}
            </Text>
          ) : (
            <>
              <Download size={20} color={COLORS.white} />
              <Text fontSize={16} fontWeight="600" color={COLORS.white}>
                {t('onboarding.startDownload') || 'Download Map'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </VStack>
  );

  // Auto Sync Step (merged with photo sync)
  const SyncStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <VStack flex={1} alignItems="center" space="xl" px={SPACING.xl}>
        <Wifi size={64} color={COLORS.primary} />
        <Heading fontSize={24} color={COLORS.text} textAlign="center">
          {t('onboarding.autoSync') || 'Automatic Sync'}
        </Heading>
        <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
          {t('onboarding.autoSyncDesc') || 'Do you want to automatically upload reports when an internet connection is available?'}
        </Text>
        
        <VStack space="md" w="100%" mt={SPACING.lg}>
          {/* Yes, sync automatically */}
          <TouchableOpacity
            style={[
              styles.optionButton,
              autoSync && styles.optionButtonActive
            ]}
            onPress={() => setAutoSync(true)}
          >
            <VStack space="md" w="100%">
              <HStack alignItems="center" space="md">
                <Box 
                  style={[
                    styles.radioOuter,
                    autoSync && styles.radioOuterActive
                  ]}
                >
                  {autoSync && <View style={styles.radioInner} />}
                </Box>
                <VStack flex={1}>
                  <Text style={{ fontWeight: '600', color: COLORS.text }}>
                    {t('onboarding.yesAutoSync') || 'Yes, sync automatically'}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                    {t('onboarding.yesAutoSyncDesc') || 'Reports upload as soon as you\'re online'}
                  </Text>
                </VStack>
              </HStack>
              
              {/* Photo upload sub-option - only visible when auto sync is selected */}
              {autoSync && (
                <TouchableOpacity
                  style={styles.subOptionButton}
                  onPress={() => setSyncWithPhotos(!syncWithPhotos)}
                >
                  <HStack alignItems="center" space="md">
                    <Box style={[
                      styles.checkboxOuter,
                      syncWithPhotos && styles.checkboxActive
                    ]}>
                      {syncWithPhotos && <CheckCircle size={16} color={COLORS.white} />}
                    </Box>
                    <VStack flex={1}>
                      <Text style={{ fontWeight: '600', color: COLORS.text, fontSize: 14 }}>
                        {t('onboarding.includePhotos') || 'Include photos'}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                        {t('onboarding.includePhotosDesc') || 'Upload images with reports (~500KB each)'}
                      </Text>
                    </VStack>
                  </HStack>
                </TouchableOpacity>
              )}
            </VStack>
          </TouchableOpacity>
          
          {/* No, sync manually */}
          <TouchableOpacity
            style={[
              styles.optionButton,
              !autoSync && styles.optionButtonActive
            ]}
            onPress={() => setAutoSync(false)}
          >
            <HStack alignItems="center" space="md">
              <Box 
                style={[
                  styles.radioOuter,
                  !autoSync && styles.radioOuterActive
                ]}
              >
                {!autoSync && <View style={styles.radioInner} />}
              </Box>
              <VStack flex={1}>
                <Text style={{ fontWeight: '600', color: COLORS.text }}>
                  {t('onboarding.noAutoSync') || 'No, I\'ll sync manually'}
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  {t('onboarding.noAutoSyncDesc') || 'You control when reports are uploaded'}
                </Text>
              </VStack>
            </HStack>
          </TouchableOpacity>
        </VStack>
      </VStack>
    </ScrollView>
  );

  // Photo Sync Step
  const PhotosStep = () => (
    <VStack flex={1} justifyContent="center" alignItems="center" space="xl" px={SPACING.xl}>
      <Camera size={64} color={COLORS.primary} />
      <Heading fontSize={24} color={COLORS.text} textAlign="center">
        {t('onboarding.photoSync') || 'Photo Upload'}
      </Heading>
      <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
        {t('onboarding.photoSyncDesc') || 'When syncing, should photos be included? This uses more data.'}
      </Text>
      
      <VStack space="md" w="100%" mt={SPACING.lg}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            syncWithPhotos && styles.optionButtonActive
          ]}
          onPress={() => setSyncWithPhotos(true)}
        >
          <HStack flex={1} alignItems="center" space="md">
            <Box 
              style={[
                styles.radioOuter,
                syncWithPhotos && styles.radioOuterActive
              ]}
            >
              {syncWithPhotos && <View style={styles.radioInner} />}
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.withPhotos') || 'Sync with photos'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.withPhotosDesc') || 'Full reports with images (~500KB each)'}
              </Text>
            </VStack>
          </HStack>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            !syncWithPhotos && styles.optionButtonActive
          ]}
          onPress={() => setSyncWithPhotos(false)}
        >
          <HStack flex={1} alignItems="center" space="md">
            <Box 
              style={[
                styles.radioOuter,
                !syncWithPhotos && styles.radioOuterActive
              ]}
            >
              {!syncWithPhotos && <View style={styles.radioInner} />}
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.withoutPhotos') || 'Sync without photos'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.withoutPhotosDesc') || 'Text and location only (~1KB each)'}
              </Text>
            </VStack>
          </HStack>
        </TouchableOpacity>
      </VStack>
    </VStack>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'language': return <LanguageStep />;
      case 'intro': return <IntroStep />;
      case 'region': return <RegionStep />;
      case 'location': return <LocationStep />;
      case 'download': return <DownloadStep />;
      case 'sync': return <SyncStep />;
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ProgressDots />
      
      {renderStep()}
      
      {/* Navigation Buttons */}
      <HStack px={SPACING.xl} py={SPACING.lg} space="md">
        {currentIndex > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
          >
            <ChevronLeft size={20} color={COLORS.textSecondary} />
            <Text color={COLORS.textSecondary} fontWeight="500">
              {t('common.back') || 'Back'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled
          ]}
          onPress={goNext}
          disabled={!canProceed()}
        >
          <Text color={COLORS.white} fontWeight="600" fontSize={16}>
            {currentStep === 'sync' 
              ? (t('common.getStarted') || 'Get Started')
              : (t('common.next') || 'Next')
            }
          </Text>
          <ChevronRight size={20} color={COLORS.white} />
        </TouchableOpacity>
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: SPACING.xl,
  },
  // Intro step styles - matching reference design
  introContainer: {
    flex: 1,
    backgroundColor: '#E8EEE4', // Soft sage green background
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  heroGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinContainer: {
    marginBottom: -20,
    zIndex: 2,
  },
  phoneIllustration: {
    position: 'relative',
    width: 200,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  phoneFrame: {
    width: 60,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    bottom: 20,
    left: 30,
    transform: [{ rotate: '-15deg' }],
  },
  // Logo styles for onboarding
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  introCard: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 15,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4C4C4',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  getStartedButton: {
    backgroundColor: '#A8C5A0', // Sage green button
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Original styles
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  progressDotComplete: {
    backgroundColor: COLORS.success,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  regionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADII.lg,
    ...SHADOWS.md,
  },
  optionButton: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '20',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  subOptionButton: {
    marginTop: SPACING.sm,
    marginLeft: 36,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    ...SHADOWS.md,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
