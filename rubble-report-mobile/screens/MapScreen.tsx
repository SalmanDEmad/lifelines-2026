import React, { useEffect, useState } from 'react';
import { FlatList, Alert, RefreshControl } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import {
  Box,
  Text,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Pressable,
} from '../components';
import {
  Image,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Icon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { useReportStore } from '../store/reportStore';
import { useTranslation } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { Report } from '../utils/database';
import { COLORS, SPACING, RADII, SHADOWS, LAYOUT, getCategoryColor, getCategoryIcon, getStatusColor, getStatusIcon, Icons, ICON_SIZES } from '../design';
import OfflineMap from '../components/OfflineMap';
import { List, Map } from 'lucide-react-native';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const MapScreen = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const localReports = useReportStore((state) => state.localReports);
  const unsyncedCount = useReportStore((state) => state.unsyncedCount);
  const loadReportsFromDB = useReportStore((state) => state.loadReportsFromDB);
  const deleteLocalReport = useReportStore((state) => state.deleteLocalReport);
  const { t } = useTranslation();
  const { user, userRole } = useAuth();

  // Filter reports based on user role
  const filteredReports = React.useMemo(() => {
    if (userRole === 'ngo') {
      // NGOs see all reports
      return localReports;
    }
    // Citizens only see their own reports
    return localReports.filter(report => report.user_id === user?.id);
  }, [localReports, userRole, user]);

  useEffect(() => {
    console.log('MapScreen mounted');
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    loadReportsFromDB();
    getUserLocation();

    return () => unsubscribe();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadReportsFromDB();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      t('map.deleteConfirm'),
      t('map.deleteConfirmMsg'),
      [
        { text: t('map.cancel'), onPress: () => {} },
        {
          text: t('map.delete'),
          onPress: async () => {
            try {
              await deleteLocalReport(reportId);
              setModalVisible(false);
            } catch (error) {
              Alert.alert(t('map.deleteError'));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Reusable Components
  const PrimaryButton = ({ 
    onPress, 
    label, 
    variant = 'primary',
    IconComponent
  }: { 
    onPress: () => void; 
    label: string; 
    variant?: 'primary' | 'danger' | 'secondary';
    IconComponent?: React.ComponentType<{ size: number; color: string }>;
  }) => {
    const bgColor = variant === 'danger' ? COLORS.error : 
                    variant === 'secondary' ? COLORS.white : COLORS.primary;
    const textColor = variant === 'secondary' ? COLORS.primary : COLORS.white;
    const borderWidth = variant === 'secondary' ? 1 : 0;
    
    return (
      <Pressable
        bg={bgColor}
        borderRadius={RADII.md}
        py={SPACING.md}
        px={SPACING.lg}
        minHeight={LAYOUT.minTouchTarget}
        flex={1}
        justifyContent="center"
        alignItems="center"
        onPress={onPress}
        borderWidth={borderWidth}
        borderColor={COLORS.border}
        style={SHADOWS.sm}
      >
        <HStack space="xs">
          {IconComponent && (
            <Box justifyContent="center">
              <IconComponent size={ICON_SIZES.sm} color={textColor} />
            </Box>
          )}
          <Box justifyContent="center">
            <Text fontSize={14} color={textColor} fontWeight="600">
              {label}
            </Text>
          </Box>
        </HStack>
      </Pressable>
    );
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const CategoryIcon = getCategoryIcon(item.category);
    const StatusIcon = getStatusIcon(Boolean(item.synced));
    
    return (
      <Pressable
        bg={COLORS.surface}
        borderRadius={RADII.lg}
        p={SPACING.base}
        mb={SPACING.sm}
        onPress={() => {
          setSelectedReport(item);
          setModalVisible(true);
        }}
        style={SHADOWS.sm}
      >
        <HStack space="md">
          <Box justifyContent="flex-start">
            <Box
              bg={getCategoryColor(item.category)}
              borderRadius={RADII.md}
              w={48}
              h={48}
              justifyContent="center"
              alignItems="center"
              flexShrink={0}
              style={SHADOWS.sm}
            >
              <CategoryIcon size={ICON_SIZES.lg} color={COLORS.white} />
            </Box>
          </Box>
          <VStack flex={1} space="xs" justifyContent="center">
            <Text fontSize={14} color={COLORS.text} numberOfLines={1} fontWeight="600">
              {item.description && item.description.length > 0
                ? item.description.substring(0, 40)
                : t(`categories.${item.category}`)}
            </Text>
            <HStack space="xs">
              <Box justifyContent="center">
                <Icons.Location size={ICON_SIZES.sm} color={COLORS.textSecondary} />
              </Box>
              <Box justifyContent="center">
                <Text fontSize={11} color={COLORS.textSecondary}>
                  {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                </Text>
              </Box>
            </HStack>
            <Text fontSize={11} color={COLORS.textMuted}>
              {formatDate(item.timestamp)}
            </Text>
          </VStack>
          <Box justifyContent="flex-start" pt={2}>
            <Box
              bg={getStatusColor(Boolean(item.synced))}
              borderRadius={RADII.sm}
              px={SPACING.sm}
              py={SPACING.xs}
              flexShrink={0}
            >
              <HStack space="xs">
                <Box justifyContent="center">
                  <StatusIcon size={12} color={COLORS.white} />
                </Box>
                <Box justifyContent="center">
                  <Text fontSize={10} color={COLORS.white} fontWeight="600">
                    {item.synced ? t('status.synced') : t('status.local')}
                  </Text>
                </Box>
              </HStack>
            </Box>
          </Box>
        </HStack>
      </Pressable>
    );
  };

  const renderDetailModal = () => {
    if (!selectedReport) return null;

    const CategoryIcon = getCategoryIcon(selectedReport.category);
    const StatusIcon = getStatusIcon(Boolean(selectedReport.synced));

    const DetailRow = ({ label, value, IconComponent }: { label: string; value: string; IconComponent?: React.ComponentType<{ size: number; color: string }> }) => (
      <HStack space="md" py={SPACING.sm}>
        {IconComponent && (
          <Box justifyContent="flex-start" pt={2}>
            <IconComponent size={ICON_SIZES.md} color={COLORS.textSecondary} />
          </Box>
        )}
        <VStack flex={1}>
          <Text fontSize={11} color={COLORS.textSecondary} mb={2}>
            {label}
          </Text>
          <Text fontSize={14} color={COLORS.text}>
            {value}
          </Text>
        </VStack>
      </HStack>
    );

    return (
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        finalFocusRef={undefined}
      >
        <ModalBackdrop />
        <ModalContent borderRadius={RADII.xl} maxWidth="90%" mx={SPACING.base}>
          <ModalHeader borderBottomWidth={1} borderBottomColor={COLORS.borderLight}>
            <HStack space="md" alignItems="center">
              <Box
                bg={getCategoryColor(selectedReport.category)}
                borderRadius={RADII.md}
                p={SPACING.sm}
              >
                <CategoryIcon size={ICON_SIZES.lg} color={COLORS.white} />
              </Box>
              <VStack>
                <Heading fontSize={18} color={COLORS.text}>
                  {t(`categories.${selectedReport.category}`)}
                </Heading>
                <Text fontSize={11} color={COLORS.textSecondary}>
                  {selectedReport.zone}
                </Text>
              </VStack>
            </HStack>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody py={SPACING.base}>
            <VStack space="sm">
              {selectedReport.imageUri && (
                <Box borderRadius={RADII.lg} overflow="hidden" mb={SPACING.sm} style={SHADOWS.md}>
                  <Image
                    source={{ uri: selectedReport.imageUri }}
                    style={{ width: '100%', height: 180 }}
                    alt="report-image"
                  />
                </Box>
              )}

              {selectedReport.description && (
                <Box 
                  bg={COLORS.surface} 
                  borderRadius={RADII.md} 
                  p={SPACING.md}
                  mb={SPACING.sm}
                >
                  <Text fontSize={14} color={COLORS.text} lineHeight={20}>
                    {selectedReport.description}
                  </Text>
                </Box>
              )}

              <DetailRow 
                label={t('map.location')}
                value={`${selectedReport.latitude.toFixed(4)}, ${selectedReport.longitude.toFixed(4)}`}
                IconComponent={Icons.Location}
              />

              <DetailRow 
                label={t('map.created')}
                value={new Date(selectedReport.timestamp).toLocaleString()}
                IconComponent={Icons.Clock}
              />

              <HStack space="md" py={SPACING.sm}>
                <Box justifyContent="flex-start" pt={2}>
                  <Icons.Stats size={ICON_SIZES.md} color={COLORS.textSecondary} />
                </Box>
                <VStack flex={1}>
                  <Text fontSize={11} color={COLORS.textSecondary} mb={2}>
                    {t('map.status')}
                  </Text>
                  <Box
                    bg={getStatusColor(Boolean(selectedReport.synced))}
                    borderRadius={RADII.sm}
                    px={SPACING.sm}
                    py={SPACING.xs}
                    alignSelf="flex-start"
                  >
                    <HStack space="xs">
                      <Box justifyContent="center">
                        <StatusIcon size={12} color={COLORS.white} />
                      </Box>
                      <Box justifyContent="center">
                        <Text fontSize={12} color={COLORS.white} fontWeight="600">
                          {selectedReport.synced ? t('status.synced') : t('status.local')}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                </VStack>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth={1} borderTopColor={COLORS.borderLight} pt={SPACING.base}>
            <HStack space="sm" w="100%">
              <PrimaryButton
                onPress={() => selectedReport.id && handleDeleteReport(selectedReport.id)}
                label={t('map.delete')}
                variant="danger"
                IconComponent={Icons.Delete}
              />
              <PrimaryButton
                onPress={() => setModalVisible(false)}
                label={t('map.close')}
                variant="secondary"
              />
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const emptyListComponent = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={SPACING['3xl']}>
      <VStack space="md" alignItems="center">
        <Icons.Empty size={64} color={COLORS.textMuted} />
        <Heading fontSize={20} color={COLORS.text}>
          {t('map.noReports')}
        </Heading>
        <Text fontSize={14} color={COLORS.textSecondary} textAlign="center" px={SPACING.xl}>
          {t('map.noReportsText')}
        </Text>
      </VStack>
    </Box>
  );

  return (
    <Box flex={1} bg={COLORS.background}>
      {/* Offline Banner */}
      {!isOnline && (
        <Box bg={COLORS.offline} px={SPACING.base} py={SPACING.sm}>
          <HStack space="sm" justifyContent="center">
            <Box justifyContent="center">
              <Icons.Offline size={ICON_SIZES.md} color={COLORS.white} />
            </Box>
            <Box justifyContent="center">
              <Text fontSize={14} color={COLORS.white} fontWeight="600">
                {t('map.offline')}
              </Text>
            </Box>
          </HStack>
        </Box>
      )}

      {/* Header */}
      <Box px={LAYOUT.screenPaddingHorizontal} pt={LAYOUT.screenPaddingTop} pb={SPACING.base}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <VStack space="xs" flex={1}>
            <Heading
              fontSize={28}
              color={COLORS.text}
              fontWeight="700"
              accessibilityRole="header"
              accessibilityLabel="Your Reports"
            >
              {t('map.title')}
            </Heading>
            <HStack space="md">
              <Box bg={COLORS.surface} borderRadius={RADII.sm} px={SPACING.sm} py={SPACING.xs}>
                <HStack space="xs">
                  <Box justifyContent="center">
                    <Icons.Stats size={ICON_SIZES.sm} color={COLORS.textSecondary} />
                  </Box>
                  <Box justifyContent="center">
                    <Text fontSize={12} color={COLORS.textSecondary}>
                      {filteredReports.length} total
                    </Text>
                  </Box>
                </HStack>
              </Box>
              <Box bg={COLORS.surface} borderRadius={RADII.sm} px={SPACING.sm} py={SPACING.xs}>
                <HStack space="xs">
                  <Box justifyContent="center">
                    <Icons.Pending size={ICON_SIZES.sm} color={COLORS.offline} />
                  </Box>
                  <Box justifyContent="center">
                    <Text fontSize={12} color={COLORS.offline}>
                      {unsyncedCount} pending
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </HStack>
          </VStack>
          {/* View Mode Toggle */}
          <HStack space="xs" bg={COLORS.surface} borderRadius={RADII.md} p={4}>
            <Pressable
              onPress={() => setViewMode('list')}
              bg={viewMode === 'list' ? COLORS.primary : 'transparent'}
              borderRadius={RADII.sm}
              p={SPACING.sm}
            >
              <List size={18} color={viewMode === 'list' ? COLORS.white : COLORS.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('map')}
              bg={viewMode === 'map' ? COLORS.primary : 'transparent'}
              borderRadius={RADII.sm}
              p={SPACING.sm}
            >
              <Map size={18} color={viewMode === 'map' ? COLORS.white : COLORS.textSecondary} />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      {/* Content - List or Map View */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id || `report-${item.timestamp}`}
          contentContainerStyle={{ 
            paddingHorizontal: LAYOUT.screenPaddingHorizontal, 
            paddingVertical: SPACING.sm,
            paddingBottom: SPACING['3xl']
          }}
          ListEmptyComponent={emptyListComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      ) : (
        <Box flex={1}>
          <OfflineMap
            reports={filteredReports}
            userLocation={userLocation}
            onReportPress={(report) => {
              setSelectedReport(report);
              setModalVisible(true);
            }}
          />
        </Box>
      )}

      {renderDetailModal()}
    </Box>
  );
};

export default MapScreen;
