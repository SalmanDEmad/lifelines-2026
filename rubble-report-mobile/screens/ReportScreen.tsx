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
import { COLORS, SPACING, RADII, SHADOWS, LAYOUT, getCategoryColor, getCategoryIcon, Icons, ICON_SIZES } from '../design';
import { getZonesByRegion, getRegionConfig, DEFAULT_REGION, REGIONS } from '../utils/zones';
import { isInGaza, isInPalestineRegion } from '../utils/geospatial';

const CATEGORIES = [
  { id: 'rubble', label: 'rubble' },
];

const REPORT_SUBCATEGORY_TYPES = [
  { id: 'hazard', label: 'hazard' },
  { id: 'blocked_road', label: 'blocked_road' },
];

const RUBBLE_SUBCATEGORIES = [
  { id: 'uxos', label: 'UXOs', color: '#DC2626' },
  { id: 'chemicals', label: 'Chemicals', color: '#F59E0B' },
  { id: 'human_remains', label: 'Human Remains', color: '#7C3AED' },
  { id: 'recyclable_concrete', label: 'Recyclable Concrete', color: '#10B981' },
];

const HAZARD_SUBCATEGORIES = [
  { id: 'uxo', label: 'Unexploded Ordnance (UXO)', color: '#DC2626' },
  { id: 'structural', label: 'Structural Collapse Risk', color: '#F59E0B' },
  { id: 'electrical', label: 'Electrical Hazard', color: '#EF4444' },
  { id: 'chemical', label: 'Chemical/Gas Leak', color: '#8B5CF6' },
  { id: 'water', label: 'Contaminated Water', color: '#3B82F6' },
  { id: 'medical', label: 'Medical Emergency', color: '#06B6D4' },
];

const BLOCKED_ROAD_SUBCATEGORIES = [
  { id: 'debris', label: 'Debris Blocking', color: '#92400E' },
  { id: 'crater', label: 'Crater/Hole', color: '#78350F' },
  { id: 'vehicle', label: 'Abandoned Vehicle', color: '#713F12' },
  { id: 'structure', label: 'Collapsed Structure', color: '#92400E' },
];

const ReportScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategoryType, setSelectedSubcategoryType] = useState<string | null>('hazard'); // Default to hazard
  const [rubbleSubcategory, setRubbleSubcategory] = useState<string | null>(null);
  const [hazardSubcategory, setHazardSubcategory] = useState<string | null>(null);
  const [blockedRoadSubcategory, setBlockedRoadSubcategory] = useState<string | null>(null);
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

  const isCoordinateInIsrael = (lat: number, lng: number): boolean => {
    // Israel approximate bounds (rough approximation for filtering)
    // North: ~33.3°, South: ~31.0°, East: ~35.9°, West: ~34.2°
    return lat >= 31.0 && lat <= 33.3 && lng >= 34.2 && lng <= 35.9;
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
    if (!selectedCategory) {
      Alert.alert(t('report.missingInfo'), t('report.selectCategory'));
      return;
    }

    if (!imageUri) {
      Alert.alert(t('report.missingInfo'), t('report.selectCategory'));
      return;
    }

    try {
      setLoading(true);

      // Get the selected region to get valid zones
      const selectedRegion = await AsyncStorage.getItem('selected_region') || DEFAULT_REGION;
      const regionZones = getZonesByRegion(selectedRegion).map(z => z.name);
      
      // Normalize the zone - use the first zone if userZone doesn't match available zones
      let reportZone = userZone;
      if (!regionZones.includes(userZone) && regionZones.length > 0) {
        console.log('Zone mismatch:', userZone, 'not in', regionZones, 'using:', regionZones[0]);
        reportZone = regionZones[0]; // Use first zone in region
      }

      // Generate random coordinates within the selected region (for privacy/safety)
      const randomCoords = generateRandomCoordinatesInRegion(selectedRegion);

      const report = {
        zone: reportZone,
        category: selectedCategory as 'rubble' | 'hazard' | 'blocked_road',
        subcategory: selectedCategory === 'rubble' ? rubbleSubcategory : selectedSubcategoryType === 'hazard' ? hazardSubcategory : blockedRoadSubcategory,
        latitude: randomCoords.latitude,
        longitude: randomCoords.longitude,
        imageUri,
        description: description.trim() || undefined,
        timestamp: Date.now(),
        user_id: user?.id, // Add user ID to report
      };

      await addLocalReport(report);
      await loadReportsFromDB();

      // Reset form
      setSelectedCategory(null);
      setRubbleSubcategory(null);
      setHazardSubcategory(null);
      setBlockedRoadSubcategory(null);
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
  const SectionHeading = ({ children }: { children: string }) => (
    <Text fontSize={16} color={COLORS.text} fontWeight="600" mb={SPACING.sm}>
      {children}
    </Text>
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
    >
      <Text fontSize={14} color={COLORS.primary} fontWeight="600">
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView flex={1} bg={COLORS.background}>
      <Box 
        px={LAYOUT.screenPaddingHorizontal} 
        pt={LAYOUT.screenPaddingTop}
        pb={SPACING['3xl']}
      >
        <VStack space="xl">
          {/* Header */}
          <Heading fontSize={28} color={COLORS.text} fontWeight="700">
            {t('report.title')}
          </Heading>

          {/* Category Picker */}
          <VStack space="sm">
            <SectionHeading>{t('report.category')}</SectionHeading>
            <HStack space="sm">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const catColor = getCategoryColor(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    flex={1}
                    py={SPACING.md}
                    px={SPACING.sm}
                    borderRadius={RADII.md}
                    bg={isSelected ? catColor : COLORS.surface}
                    borderWidth={isSelected ? 0 : 1}
                    borderColor={COLORS.border}
                    onPress={() => setSelectedCategory(cat.id)}
                    minHeight={LAYOUT.minTouchTarget}
                    alignItems="center"
                    justifyContent="center"
                    style={isSelected ? SHADOWS.md : {}}
                  >
                    {(() => {
                      const CategoryIcon = getCategoryIcon(cat.id);
                      return (
                        <Box mb={SPACING.xs}>
                          <CategoryIcon size={ICON_SIZES.lg} color={isSelected ? COLORS.white : catColor} />
                        </Box>
                      );
                    })()}
                    <Text
                      color={isSelected ? COLORS.white : COLORS.text}
                      fontWeight="600"
                      textAlign="center"
                      fontSize={12}
                    >
                      {t(`categories.${cat.label}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          {/* Rubble Subcategory Selection */}
          {selectedCategory === 'rubble' && (
            <VStack space="sm">
              <SectionHeading>{t('report.rubbleType') || 'Type of Rubble'}</SectionHeading>
              <VStack space="sm">
                {RUBBLE_SUBCATEGORIES.map((sub) => {
                  const isSelected = rubbleSubcategory === sub.id;
                  return (
                    <Pressable
                      key={sub.id}
                      py={SPACING.md}
                      px={SPACING.lg}
                      borderRadius={RADII.md}
                      bg={isSelected ? sub.color : COLORS.surface}
                      borderWidth={isSelected ? 0 : 1}
                      borderColor={COLORS.border}
                      onPress={() => setRubbleSubcategory(sub.id)}
                      minHeight={LAYOUT.minTouchTarget}
                      flexDirection="row"
                      alignItems="center"
                      style={isSelected ? SHADOWS.md : {}}
                    >
                      <Box 
                        w={12} 
                        h={12} 
                        borderRadius={6} 
                        bg={isSelected ? COLORS.white : sub.color} 
                        mr={SPACING.md}
                        opacity={isSelected ? 0.9 : 1}
                      />
                      <Text
                        color={isSelected ? COLORS.white : COLORS.text}
                        fontWeight="600"
                        fontSize={14}
                      >
                        {sub.label}
                      </Text>
                      {isSelected && (
                        <Box ml="auto">
                          <Icons.Synced size={ICON_SIZES.md} color={COLORS.white} />
                        </Box>
                      )}
                    </Pressable>
                  );
                })}
              </VStack>
            </VStack>
          )}

          {/* Hazard/Blocked Road Subcategory Dropdown */}
          {selectedCategory === 'rubble' && (
            <>
              <VStack space="sm">
                <SectionHeading>{t('report.reportType') || 'Report Type'}</SectionHeading>
                <HStack space="sm">
                  {REPORT_SUBCATEGORY_TYPES.map((type) => {
                    const isSelected = selectedSubcategoryType === type.id;
                    const typeColor = getCategoryColor(type.id);
                    return (
                      <Pressable
                        key={type.id}
                        flex={1}
                        py={SPACING.md}
                        px={SPACING.sm}
                        borderRadius={RADII.md}
                        bg={isSelected ? typeColor : COLORS.surface}
                        borderWidth={isSelected ? 0 : 1}
                        borderColor={COLORS.border}
                        onPress={() => setSelectedSubcategoryType(type.id)}
                        minHeight={LAYOUT.minTouchTarget}
                        alignItems="center"
                        justifyContent="center"
                        style={isSelected ? SHADOWS.md : {}}
                      >
                        {(() => {
                          const TypeIcon = getCategoryIcon(type.id);
                          return (
                            <Box mb={SPACING.xs}>
                              <TypeIcon size={ICON_SIZES.lg} color={isSelected ? COLORS.white : typeColor} />
                            </Box>
                          );
                        })()}
                        <Text
                          color={isSelected ? COLORS.white : COLORS.text}
                          fontWeight="600"
                          textAlign="center"
                          fontSize={12}
                        >
                          {t(`categories.${type.label}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>

              {/* Show appropriate subcategories based on type selection */}
              {selectedSubcategoryType === 'hazard' && (
                <VStack space="sm">
                  <SectionHeading>{t('report.hazardType') || 'Type of Hazard'}</SectionHeading>
                  <VStack space="sm">
                    {HAZARD_SUBCATEGORIES.map((sub) => {
                      const isSelected = hazardSubcategory === sub.id;
                      return (
                        <Pressable
                          key={sub.id}
                          py={SPACING.md}
                          px={SPACING.lg}
                          borderRadius={RADII.md}
                          bg={isSelected ? sub.color : COLORS.surface}
                          borderWidth={isSelected ? 0 : 1}
                          borderColor={COLORS.border}
                          onPress={() => setHazardSubcategory(sub.id)}
                          minHeight={LAYOUT.minTouchTarget}
                          flexDirection="row"
                          alignItems="center"
                          style={isSelected ? SHADOWS.md : {}}
                        >
                          <Box 
                            w={12} 
                            h={12} 
                            borderRadius={6} 
                            bg={isSelected ? COLORS.white : sub.color} 
                            mr={SPACING.md}
                            opacity={isSelected ? 0.9 : 1}
                          />
                          <Text
                            color={isSelected ? COLORS.white : COLORS.text}
                            fontWeight="600"
                            fontSize={14}
                          >
                            {sub.label}
                          </Text>
                          {isSelected && (
                            <Box ml="auto">
                              <Icons.Synced size={ICON_SIZES.md} color={COLORS.white} />
                            </Box>
                          )}
                        </Pressable>
                      );
                    })}
                  </VStack>
                </VStack>
              )}
            </>
          )}

          {/* Blocked Road Subcategory Selection */}
          {selectedCategory === 'rubble' && selectedSubcategoryType === 'blocked_road' && (
            <VStack space="sm">
              <SectionHeading>{t('report.blockedRoadType') || 'Type of Blockage'}</SectionHeading>
              <VStack space="sm">
                {BLOCKED_ROAD_SUBCATEGORIES.map((sub) => {
                  const isSelected = blockedRoadSubcategory === sub.id;
                  return (
                    <Pressable
                      key={sub.id}
                      py={SPACING.md}
                      px={SPACING.lg}
                      borderRadius={RADII.md}
                      bg={isSelected ? sub.color : COLORS.surface}
                      borderWidth={isSelected ? 0 : 1}
                      borderColor={COLORS.border}
                      onPress={() => setBlockedRoadSubcategory(sub.id)}
                      minHeight={LAYOUT.minTouchTarget}
                      flexDirection="row"
                      alignItems="center"
                      style={isSelected ? SHADOWS.md : {}}
                    >
                      <Box 
                        w={12} 
                        h={12} 
                        borderRadius={6} 
                        bg={isSelected ? COLORS.white : sub.color} 
                        mr={SPACING.md}
                        opacity={isSelected ? 0.9 : 1}
                      />
                      <Text
                        color={isSelected ? COLORS.white : COLORS.text}
                        fontWeight="600"
                        fontSize={14}
                      >
                        {sub.label}
                      </Text>
                      {isSelected && (
                        <Box ml="auto">
                          <Icons.Synced size={ICON_SIZES.md} color={COLORS.white} />
                        </Box>
                      )}
                    </Pressable>
                  );
                })}
              </VStack>
            </VStack>
          )}

          {/* Camera Section */}
          <VStack space="sm">
            <SectionHeading>{t('report.photo')}</SectionHeading>
            {imageUri ? (
              <VStack space="md">
                <Box borderRadius={RADII.lg} overflow="hidden" style={SHADOWS.md}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: 280 }}
                    alt="report-photo"
                  />
                </Box>
                {imageSize && (
                  <HStack justifyContent="space-between">
                    <HStack space="xs">
                      <Box justifyContent="center">
                        <Icons.Photo size={ICON_SIZES.sm} color={COLORS.textSecondary} />
                      </Box>
                      <Box justifyContent="center">
                        <Text fontSize={12} color={COLORS.textSecondary}>
                          Size: {imageSize}KB{imageSize > 500 && ' (large)'}
                        </Text>
                      </Box>
                    </HStack>
                    <SecondaryButton onPress={retakePhoto} label={t('report.retakePhoto')} />
                  </HStack>
                )}
              </VStack>
            ) : (
              <Pressable
                bg={COLORS.surface}
                borderRadius={RADII.lg}
                py={SPACING['2xl']}
                alignItems="center"
                justifyContent="center"
                onPress={takePhoto}
                borderWidth={2}
                borderColor={COLORS.border}
                borderStyle="dashed"
                minHeight={160}
              >
                <Icons.Camera size={ICON_SIZES.xl} color={COLORS.textSecondary} />
                <Text fontSize={14} color={COLORS.textSecondary} mt={SPACING.sm}>
                  {t('report.tapToPhoto') || 'Tap to take a photo'}
                </Text>
              </Pressable>
            )}
          </VStack>

          {/* Description Section */}
          <VStack space="sm">
            <SectionHeading>{t('report.description')}</SectionHeading>
            <Box
              bg={COLORS.white}
              borderColor={COLORS.border}
              borderWidth={1}
              borderRadius={RADII.md}
              p={SPACING.sm}
            >
              <Input
                variant="outline"
                h={100}
                borderWidth={0}
              >
                <InputField
                  placeholder={t('report.descriptionPlaceholder')}
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={300}
                  multiline
                  fontSize={14}
                  color={COLORS.text}
                />
              </Input>
            </Box>
            <Text fontSize={11} color={COLORS.textMuted} textAlign="right">
              {description.length}/300
            </Text>
          </VStack>

          {/* Location Section */}
          <VStack space="sm">
            <SectionHeading>{t('report.location')}</SectionHeading>
            <Box
              bg={COLORS.surface}
              borderRadius={RADII.lg}
              p={SPACING.base}
              borderStartWidth={4}
              borderStartColor={COLORS.success}
              style={SHADOWS.sm}
            >
              <HStack space="md">
                <Box justifyContent="center">
                  <Icons.Location size={ICON_SIZES.lg} color={COLORS.success} />
                </Box>
                <VStack flex={1} space="xs" justifyContent="center">
                  <Text fontSize={12} color={COLORS.textSecondary}>
                    📍 Random coordinates (privacy protected)
                  </Text>
                  <Text fontSize={14} color={COLORS.text} fontWeight="600">
                    Zone: {userZone}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>

          {/* Status Section */}
          <Box
            bg={COLORS.surface}
            borderRadius={RADII.lg}
            p={SPACING.base}
            borderStartWidth={4}
            borderStartColor={COLORS.success}
          >
            <HStack space="md">
              <Box justifyContent="center">
                <Icons.Stats size={ICON_SIZES.lg} color={COLORS.success} />
              </Box>
              <VStack flex={1} justifyContent="center">
                <Text fontSize={12} color={COLORS.textSecondary}>
                  {t('report.status')}
                </Text>
                <Text fontSize={14} color={COLORS.text} fontWeight="500">
                  {t('report.waiting', { count: unsyncedCount })}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Submit Button */}
          <Box mt={SPACING.md}>
            <PrimaryButton 
              onPress={submitReport}
              label={t('report.submit')}
              disabled={!selectedCategory || !imageUri || loading}
              isLoading={loading}
              IconComponent={Icons.Upload}
            />
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default ReportScreen;
