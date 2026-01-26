import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
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

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingStep = 'language' | 'intro' | 'location' | 'download' | 'sync' | 'photos';

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncWithPhotos, setSyncWithPhotos] = useState(true);
  
  const insets = useSafeAreaInsets();
  const { t, setLanguage, isRTL } = useTranslation();

  const steps: OnboardingStep[] = ['language', 'intro', 'location', 'download', 'sync', 'photos'];
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDetectedZone('Gaza City - North');
    setIsDetectingLocation(false);
  };

  const handleDownloadMap = async () => {
    setIsDownloading(true);
    
    // DEMO: Simulate map download
    // TODO: Implement actual tile caching for offline maps
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDownloadComplete(true);
    setIsDownloading(false);
  };

  const handleComplete = async () => {
    // Save onboarding preferences
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('auto_sync', autoSync ? 'true' : 'false');
    await AsyncStorage.setItem('sync_with_photos', syncWithPhotos ? 'true' : 'false');
    await AsyncStorage.setItem('user_zone', detectedZone || 'Unknown');
    
    onComplete();
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      // Skip photos step if auto sync is disabled
      if (steps[nextIndex] === 'photos' && !autoSync) {
        handleComplete();
      } else {
        setCurrentStep(steps[nextIndex]);
      }
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
      case 'location': return detectedZone !== null;
      case 'download': return downloadComplete;
      case 'sync': return true;
      case 'photos': return true;
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

  // Introduction Step
  const IntroStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <VStack flex={1} alignItems="center" space="lg" px={SPACING.xl}>
        <Info size={64} color={COLORS.primary} />
        <Heading fontSize={24} color={COLORS.text} textAlign="center">
          {t('onboarding.welcomeTitle') || 'Welcome to Amal'}
        </Heading>
        
        <Text fontSize={15} color={COLORS.textSecondary} textAlign="center" lineHeight={24}>
          {t('onboarding.welcomeDesc') || 'This app helps you report hazards in your area - rubble, blocked roads, and dangers - to help humanitarian organizations respond faster.'}
        </Text>
        
        <VStack space="md" w="100%" mt={SPACING.lg}>
          <HStack space="md" alignItems="center" bg={COLORS.surface} p={SPACING.md} borderRadius={RADII.lg}>
            <Box bg={COLORS.primary + '20'} p={SPACING.sm} borderRadius={RADII.md}>
              <Camera size={24} color={COLORS.primary} />
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.feature1') || 'Take Photos'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.feature1Desc') || 'Capture hazards with your camera'}
              </Text>
            </VStack>
          </HStack>
          
          <HStack space="md" alignItems="center" bg={COLORS.surface} p={SPACING.md} borderRadius={RADII.lg}>
            <Box bg={COLORS.success + '20'} p={SPACING.sm} borderRadius={RADII.md}>
              <MapPin size={24} color={COLORS.success} />
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.feature2') || 'Auto Location'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.feature2Desc') || 'GPS coordinates are captured automatically'}
              </Text>
            </VStack>
          </HStack>
          
          <HStack space="md" alignItems="center" bg={COLORS.surface} p={SPACING.md} borderRadius={RADII.lg}>
            <Box bg={COLORS.warning + '20'} p={SPACING.sm} borderRadius={RADII.md}>
              <Wifi size={24} color={COLORS.warning} />
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.feature3') || 'Works Offline'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.feature3Desc') || 'Reports save locally and sync when online'}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </ScrollView>
  );

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

  // Auto Sync Step
  const SyncStep = () => (
    <VStack flex={1} justifyContent="center" alignItems="center" space="xl" px={SPACING.xl}>
      <Wifi size={64} color={COLORS.primary} />
      <Heading fontSize={24} color={COLORS.text} textAlign="center">
        {t('onboarding.autoSync') || 'Automatic Sync'}
      </Heading>
      <Text fontSize={15} color={COLORS.textSecondary} textAlign="center">
        {t('onboarding.autoSyncDesc') || 'Do you want to automatically upload reports when an internet connection is available?'}
      </Text>
      
      <VStack space="md" w="100%" mt={SPACING.lg}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            autoSync && styles.optionButtonActive
          ]}
          onPress={() => setAutoSync(true)}
        >
          <HStack flex={1} alignItems="center" space="md">
            <Box 
              style={[
                styles.radioOuter,
                autoSync && styles.radioOuterActive
              ]}
            >
              {autoSync && <View style={styles.radioInner} />}
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.yesAutoSync') || 'Yes, sync automatically'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.yesAutoSyncDesc') || 'Reports upload as soon as you\'re online'}
              </Text>
            </VStack>
          </HStack>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            !autoSync && styles.optionButtonActive
          ]}
          onPress={() => setAutoSync(false)}
        >
          <HStack flex={1} alignItems="center" space="md">
            <Box 
              style={[
                styles.radioOuter,
                !autoSync && styles.radioOuterActive
              ]}
            >
              {!autoSync && <View style={styles.radioInner} />}
            </Box>
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t('onboarding.noAutoSync') || 'No, I\'ll sync manually'}
              </Text>
              <Text fontSize={13} color={COLORS.textSecondary}>
                {t('onboarding.noAutoSyncDesc') || 'You control when reports are uploaded'}
              </Text>
            </VStack>
          </HStack>
        </TouchableOpacity>
      </VStack>
    </VStack>
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
      case 'location': return <LocationStep />;
      case 'download': return <DownloadStep />;
      case 'sync': return <SyncStep />;
      case 'photos': return <PhotosStep />;
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
            {currentStep === 'photos' || (currentStep === 'sync' && !autoSync) 
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
