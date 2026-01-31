import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
import { Input, InputField, Image } from '@gluestack-ui/themed';
import { useReportStore } from '../store/reportStore';
import { useTranslation } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADII, SHADOWS, LAYOUT, Icons, ICON_SIZES } from '../design';
import { getZonesByRegion, DEFAULT_REGION, REGIONS } from '../utils/zones';
import { isInGaza, isInPalestineRegion } from '../utils/geospatial';

// Material types for rubble - using native emoji display
const MATERIALS = [
  { id: 'concrete', label: 'Concrete', emoji: '🏛️', color: '#64748B', bgTint: '#F1F5F9' },
  { id: 'wood', label: 'Wood', emoji: '🪵', color: '#92400E', bgTint: '#FEF3C7' },
  { id: 'metal', label: 'Metal', emoji: '⚙️', color: '#475569', bgTint: '#E2E8F0' },
];

// Optional hazards with emojis - danger colors
const HAZARDS = [
  { id: 'uxo', label: 'UXOs', emoji: '💣', color: '#DC2626', bgTint: '#FEE2E2' },
  { id: 'bodies', label: 'Bodies', emoji: '🧎', color: '#7C3AED', bgTint: '#EDE9FE' },
  { id: 'chemicals', label: 'Chemicals', emoji: '🧪', color: '#F59E0B', bgTint: '#FEF3C7' },
  { id: 'electrical', label: 'Electric', emoji: '⚡', color: '#EF4444', bgTint: '#FEE2E2' },
  { id: 'blocked_road', label: 'Road Block', emoji: '🚧', color: '#92400E', bgTint: '#FFEDD5' },
  { id: 'gas_leak', label: 'Gas Leak', emoji: '💨', color: '#059669', bgTint: '#D1FAE5' },
];

const ReportScreen = () => {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [userZone, setUserZone] = useState<string>('');

  const addLocalReport = useReportStore((state) => state.addLocalReport);
  const unsyncedCount = useReportStore((state) => state.unsyncedCount);
  const loadReportsFromDB = useReportStore((state) => state.loadReportsFromDB);
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    console.log('ReportScreen mounted');
    getLocationOnMount();
    getUserZone();
  }, []);

  const getUserZone = async () => {
    try {
      // First try 'user_zone' (saved by onboarding), fallback to 'userZone' for backwards compatibility
      let zone = await AsyncStorage.getItem('user_zone');
      if (!zone) {
        zone = await AsyncStorage.getItem('userZone');
      }
      setUserZone(zone || '');
    } catch (error) {
      console.error('Error getting user zone:', error);
    }
  };

  const getLocationOnMount = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const showPhotoSafetyWarning = () => {
    Alert.alert(
      t('report.safetyWarning') || 'Safety Warning',
      t('report.safetyMessage') || 'Do not endanger yourself when taking photos. Stay away from unstable structures, hazardous materials, and dangerous areas. Your safety is the priority.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: t('report.proceedToPhoto') || 'I Understand, Take Photo', onPress: takePhotoAfterWarning }
      ]
    );
  };

  const takePhotoAfterWarning = async () => {
    try {
      // Request camera permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('report.permissionDenied'),
          t('report.cameraRequired'),
          [{ text: t('setup.tryAgain'), onPress: takePhotoAfterWarning }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        
        // Compress the image
        const compressed = await ImageManipulator.manipulateAsync(
          photoUri,
          [{ resize: { width: 1024, height: 1024 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setImageUri(compressed.uri);
        
        // Get compressed file size
        const fileInfo = await fetch(compressed.uri);
        const blob = await fileInfo.blob();
        const fileSizeKB = Math.round(blob.size / 1024);
        setImageSize(fileSizeKB);

        if (fileSizeKB > 500) {
          Alert.alert(
            t('report.largeFile'),
            t('report.largeFileWarning', { size: fileSizeKB })
          );
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('report.photoError'));
    }
  };

  const takePhoto = () => {
    showPhotoSafetyWarning();
  };

  const retakePhoto = () => {
    setImageUri(null);
    setImageSize(null);
    showPhotoSafetyWarning();
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const toggleHazard = (hazardId: string) => {
    setSelectedHazards(prev =>
      prev.includes(hazardId)
        ? prev.filter(id => id !== hazardId)
        : [...prev, hazardId]
    );
  };

  const generateRandomCoordinatesInRegion = (regionKey: string) => {
    const region = REGIONS[regionKey as keyof typeof REGIONS];
    const targetRegion = region || REGIONS['palestine'];
    
    // For Gaza (Palestine), use polygon-based checking
    const isGazaRegion = regionKey === 'palestine' || !region;
    
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      const randomLat = targetRegion.bounds.minLat + Math.random() * (targetRegion.bounds.maxLat - targetRegion.bounds.minLat);
      const randomLng = targetRegion.bounds.minLng + Math.random() * (targetRegion.bounds.maxLng - targetRegion.bounds.minLng);
      
      // For Gaza, use polygon-based geospatial check
      if (isGazaRegion) {
        // Only accept coordinates that are actually in Gaza (not in Israel buffer zone)
        if (isInGaza(randomLat, randomLng) || isInPalestineRegion(randomLat, randomLng)) {
          return { latitude: randomLat, longitude: randomLng };
        }
      } else {
        // For other regions, just check if it's within bounds
        return { latitude: randomLat, longitude: randomLng };
      }
      
      attempts++;
    }
    
    // Fallback: use region center if we couldn't find valid coordinates
    console.warn(`[COORDS] Could not generate valid coordinates after ${maxAttempts} attempts, using region center`);
    return { latitude: targetRegion.center.latitude, longitude: targetRegion.center.longitude };
  };

  const submitReport = async () => {
    if (selectedMaterials.length === 0) {
      Alert.alert(t('report.missingInfo'), t('report.materialsRequired'));
      return;
    }

    if (!imageUri) {
      Alert.alert(t('report.missingInfo'), t('report.selectCategory'));
      return;
    }

    try {
      setLoading(true);

      const selectedRegion = await AsyncStorage.getItem('selected_region') || DEFAULT_REGION;
      const regionZones = getZonesByRegion(selectedRegion).map(z => z.name);
      
      let reportZone = userZone;
      if (!regionZones.includes(userZone) && regionZones.length > 0) {
        console.log('Zone mismatch:', userZone, 'not in', regionZones, 'using:', regionZones[0]);
        reportZone = regionZones[0];
      }

      const randomCoords = generateRandomCoordinatesInRegion(selectedRegion);

      const report = {
        zone: reportZone,
        category: 'rubble' as const,
        subcategory: `materials:${selectedMaterials.join(',')}${selectedHazards.length > 0 ? `|hazards:${selectedHazards.join(',')}` : ''}`,
        latitude: randomCoords.latitude,
        longitude: randomCoords.longitude,
        imageUri,
        description: description.trim() || undefined,
        timestamp: Date.now(),
        user_id: user?.id,
      };

      await addLocalReport(report);
      await loadReportsFromDB();

      // Reset form
      setSelectedMaterials([]);
      setSelectedHazards([]);
      setImageUri(null);
      setImageSize(null);
      setDescription('');

      Alert.alert(t('report.submitted'));
    } catch (error) {
      console.error('Report submission error:', error);
      Alert.alert(t('report.submitError'));
    } finally {
      setLoading(false);
    }
  };

  // Reusable Components
  
  // Progress indicator
  const getProgress = () => {
    let steps = 0;
    if (imageUri) steps++;
    if (selectedMaterials.length > 0) steps++;
    if (description.length > 0) steps++;
    return steps;
  };
  
  const ProgressBar = () => {
    const progress = getProgress();
    const total = 3;
    return (
      <VStack space="xs">
        <HStack justifyContent="space-between">
          <Text fontSize={12} color={COLORS.textSecondary}>
            {progress === 0 ? t('report.startByTakingPhoto') : progress === total ? t('report.readyToSubmit') : t('report.completed', { count: progress, total })}
          </Text>
          <Text fontSize={12} color={COLORS.primary} fontWeight="600">
            {Math.round((progress / total) * 100)}%
          </Text>
        </HStack>
        <Box height={4} bg={COLORS.border} borderRadius={RADII.full} overflow="hidden">
          <Box 
            height="100%" 
            width={`${(progress / total) * 100}%`}
            bg={progress === total ? COLORS.success : COLORS.primary}
            borderRadius={RADII.full}
          />
        </Box>
      </VStack>
    );
  };

  const SectionLabel = ({ children, required = false }: { children: string; required?: boolean }) => (
    <HStack space="sm" alignItems="center" mb={SPACING.sm}>
      <Text fontSize={16} color={COLORS.text} fontWeight="600">
        {children}
      </Text>
      {required && (
        <Box bg="#FEE2E2" px={8} py={2} borderRadius={RADII.full}>
          <Text fontSize={10} color="#DC2626" fontWeight="700">REQUIRED</Text>
        </Box>
      )}
    </HStack>
  );

  const PrimaryButton = ({ 
    onPress, 
    label, 
    disabled = false, 
    isLoading = false,
    IconComponent
  }: { 
    onPress: () => void; 
    label: string; 
    disabled?: boolean;
    isLoading?: boolean;
    IconComponent?: React.ComponentType<{ size: number; color: string }>;
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
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={disabled ? 'This button is disabled' : `Tap to ${label.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <HStack space="sm">
          {IconComponent && (
            <Box justifyContent="center">
              <IconComponent size={ICON_SIZES.md} color={COLORS.white} />
            </Box>
          )}
          <Box justifyContent="center">
            <Text fontSize={16} color={COLORS.white} fontWeight="600">
              {label}
            </Text>
          </Box>
        </HStack>
      )}
    </Pressable>
  );

  const SecondaryButton = ({ onPress, label }: { onPress: () => void; label: string }) => (
    <Pressable
      bg={COLORS.white}
      borderRadius={RADII.md}
      py={SPACING.md}
      px={SPACING.lg}
      minHeight={LAYOUT.minTouchTarget}
      justifyContent="center"
      alignItems="center"
      onPress={onPress}
      borderWidth={1}
      borderColor={COLORS.border}
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={`Tap to ${label.toLowerCase()}`}
      accessibilityRole="button"
    >
      <Text fontSize={14} color={COLORS.primary} fontWeight="600">
        {label}
      </Text>
    </Pressable>
  );

  const TagButton = ({ 
    id, 
    label, 
    color, 
    emoji,
    bgTint,
    isSelected, 
    onToggle,
    size = 'normal'
  }: { 
    id: string; 
    label: string; 
    color: string;
    emoji: string;
    bgTint?: string;
    isSelected: boolean;
    onToggle: (id: string) => void;
    size?: 'normal' | 'small';
  }) => {
    const isSmall = size === 'small';
    return (
      <Pressable
        width={isSmall ? '31%' : '31%'}
        py={isSmall ? SPACING.md : SPACING.lg}
        borderRadius={RADII.xl}
        bg={isSelected ? color : (bgTint || COLORS.surface)}
        borderWidth={isSelected ? 3 : 2}
        borderColor={isSelected ? color : (bgTint ? color + '40' : COLORS.border)}
        onPress={() => onToggle(id)}
        justifyContent="center"
        alignItems="center"
        style={isSelected ? { ...SHADOWS.lg, elevation: 8, transform: [{ scale: 1.02 }] } : SHADOWS.sm}
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        <VStack alignItems="center" space="xs">
          <Text fontSize={isSmall ? 28 : 32} style={{ lineHeight: isSmall ? 34 : 40 }}>
            {emoji}
          </Text>
          <Text
            color={isSelected ? COLORS.white : COLORS.text}
            fontWeight="700"
            fontSize={isSmall ? 11 : 12}
            textAlign="center"
            numberOfLines={1}
          >
            {label}
          </Text>
        </VStack>
        {isSelected && (
          <Box 
            position="absolute" 
            top={6} 
            right={6}
            bg="rgba(255,255,255,0.4)"
            borderRadius={RADII.full}
            p={3}
          >
            <Icons.Synced size={12} color={COLORS.white} />
          </Box>
        )}
      </Pressable>
    );
  };

  return (
    <Box flex={1} bg={COLORS.background}>
      <ScrollView flex={1}>
        <Box 
          px={LAYOUT.screenPaddingHorizontal} 
          pt={SPACING.lg}
          pb={120}
        >
          <VStack space="lg">
            {/* Header */}
            <VStack space="sm">
              <Text fontSize={13} color={COLORS.textSecondary} fontWeight="500">
                {t('report.reportingFrom', { zone: userZone || 'Loading zone...' })}
              </Text>
              <Heading fontSize={26} color={COLORS.text} fontWeight="800">
                {t('report.titleSimple')}
              </Heading>
              <ProgressBar />
            </VStack>

            {/* STEP 1: Camera Section - FIRST */}
            <VStack space="sm">
              <SectionLabel required>{t('report.photo')}</SectionLabel>
              {imageUri ? (
                <VStack space="sm">
                  <Box borderRadius={RADII.xl} overflow="hidden" style={SHADOWS.lg}>
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: 220 }}
                      alt="report-photo"
                    />
                    <Box position="absolute" bottom={12} right={12}>
                      <Pressable 
                        bg="rgba(0,0,0,0.6)" 
                        px={SPACING.md} 
                        py={SPACING.sm}
                        borderRadius={RADII.full}
                        onPress={retakePhoto}
                      >
                        <HStack space="xs" alignItems="center">
                          <Icons.Camera size={14} color={COLORS.white} />
                          <Text fontSize={12} color={COLORS.white} fontWeight="600">{t('report.retakePhoto')}</Text>
                        </HStack>
                      </Pressable>
                    </Box>
                  </Box>
                  <Box bg="#D1FAE5" borderRadius={RADII.md} px={SPACING.md} py={SPACING.sm}>
                    <Text fontSize={12} color="#059669" fontWeight="600">
                      ✓ {t('report.photoCaptured')} {imageSize && `(${imageSize}KB)`}
                    </Text>
                  </Box>
                </VStack>
              ) : (
                <Pressable
                  bg="#EFF6FF"
                  borderRadius={RADII.xl}
                  py={SPACING['2xl']}
                  alignItems="center"
                  justifyContent="center"
                  onPress={takePhoto}
                  borderWidth={2}
                  borderColor="#3B82F6"
                  borderStyle="dashed"
                  minHeight={180}
                  style={SHADOWS.sm}
                >
                  <Box 
                    bg="#3B82F6" 
                    p={SPACING.lg} 
                    borderRadius={RADII.full}
                    mb={SPACING.md}
                  >
                    <Icons.Camera size={32} color={COLORS.white} />
                  </Box>
                  <Text fontSize={16} color="#3B82F6" fontWeight="700">
                    {t('report.tapToPhoto')}
                  </Text>
                  <Text fontSize={12} color={COLORS.textSecondary} mt={SPACING.xs}>
                    {t('report.thisHelpsVerify')}
                  </Text>
                </Pressable>
              )}
            </VStack>

            {/* STEP 2: Materials Section */}
            <VStack space="sm">
              <SectionLabel required>{t('report.selectMaterials')}</SectionLabel>
              <HStack flexWrap="wrap" justifyContent="space-between" style={{ gap: 10 }}>
                {MATERIALS.map((material) => {
                  const isSelected = selectedMaterials.includes(material.id);
                  return (
                    <TagButton
                      key={material.id}
                      id={material.id}
                      label={t(`materials.${material.id}`) || material.label}
                      color={material.color}
                      emoji={material.emoji}
                      bgTint={material.bgTint}
                      isSelected={isSelected}
                      onToggle={toggleMaterial}
                    />
                  );
                })}
              </HStack>
            </VStack>

            {/* STEP 3: Hazards Section */}
            <VStack space="sm">
              <SectionLabel>{t('report.selectHazards')}</SectionLabel>
              <HStack flexWrap="wrap" justifyContent="flex-start" style={{ gap: 8 }}>
                {HAZARDS.map((hazard) => {
                  const isSelected = selectedHazards.includes(hazard.id);
                  return (
                    <TagButton
                      key={hazard.id}
                      id={hazard.id}
                      label={t(`hazards.${hazard.id}`) || hazard.label}
                      color={hazard.color}
                      emoji={hazard.emoji}
                      bgTint={hazard.bgTint}
                      isSelected={isSelected}
                      onToggle={toggleHazard}
                      size="small"
                    />
                  );
                })}
              </HStack>
              {selectedHazards.length > 0 && (
                <Box bg={COLORS.warningLight} borderRadius={RADII.md} px={SPACING.md} py={SPACING.sm}>
                  <Text fontSize={12} color="#B45309" fontWeight="600">
                    ⚠️ {selectedHazards.length} hazard(s) will be flagged for urgent attention
                  </Text>
                </Box>
              )}
            </VStack>

            {/* Optional: Description */}
            <VStack space="sm">
              <SectionLabel>{t('report.addDetails')}</SectionLabel>
              <Box
                bg={COLORS.white}
                borderColor={COLORS.border}
                borderWidth={1}
                borderRadius={RADII.lg}
                overflow="hidden"
              >
                <Input variant="outline" h={80} borderWidth={0}>
                  <InputField
                    placeholder={t('report.descriptionPlaceholder')}
                    placeholderTextColor={COLORS.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    multiline
                    fontSize={14}
                    color={COLORS.text}
                    p={SPACING.md}
                  />
                </Input>
              </Box>
              <Text fontSize={11} color={COLORS.textMuted} textAlign="right">
                {description.length}/200
              </Text>
            </VStack>

          </VStack>
        </Box>
      </ScrollView>
      
      {/* Floating Submit Button */}
      <Box 
        position="absolute" 
        bottom={0} 
        left={0} 
        right={0}
        bg={COLORS.white}
        px={LAYOUT.screenPaddingHorizontal}
        py={SPACING.md}
        style={{ 
          ...SHADOWS.lg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <Pressable
          bg={selectedMaterials.length === 0 || !imageUri ? COLORS.border : '#059669'}
          borderRadius={RADII.lg}
          py={SPACING.base}
          justifyContent="center"
          alignItems="center"
          onPress={selectedMaterials.length === 0 || !imageUri || loading ? undefined : submitReport}
          opacity={selectedMaterials.length === 0 || !imageUri ? 0.5 : 1}
          style={selectedMaterials.length > 0 && imageUri ? SHADOWS.lg : {}}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <HStack space="sm" alignItems="center">
              <Icons.Upload size={20} color={COLORS.white} />
              <Text fontSize={17} color={COLORS.white} fontWeight="700">
                {t('report.submitReport')}
              </Text>
            </HStack>
          )}
        </Pressable>
        {unsyncedCount > 0 && (
          <Text fontSize={11} color={COLORS.textSecondary} textAlign="center" mt={SPACING.xs}>
            {t('report.reportsWaitingSync', { count: unsyncedCount })}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default ReportScreen;
