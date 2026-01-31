import React, { useEffect, useState } from 'react';
import { FlatList, Alert, RefreshControl } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
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
import { List, Map, Navigation2, RefreshCw } from 'lucide-react-native';
import { getZonesByRegion, getRegionConfig, DEFAULT_REGION, REGIONS } from '../utils/zones';
import { supabase } from '../utils/supabase';
import { manualSync } from '../utils/syncManager';

// Demo reports data for all regions
const DEMO_REPORTS_BY_REGION: Record<string, Array<{ zone: string; category: string; lat: number; lng: number; description: string }>> = {
  palestine: [
    { zone: 'Gaza City', category: 'rubble', lat: 31.5150, lng: 34.4500, description: 'Collapsed residential building - 3 floors' },
    { zone: 'Gaza City', category: 'hazard', lat: 31.5080, lng: 34.4650, description: 'Unexploded ordnance reported near school' },
    { zone: 'Gaza City', category: 'blocked_road', lat: 31.5200, lng: 34.4400, description: 'Main road blocked by debris' },
    { zone: 'North Gaza', category: 'rubble', lat: 31.5500, lng: 34.4900, description: 'Multiple buildings collapsed in Beit Hanoun' },
    { zone: 'North Gaza', category: 'hazard', lat: 31.5600, lng: 34.4700, description: 'Gas leak from damaged infrastructure' },
    { zone: 'Central Gaza', category: 'rubble', lat: 31.4600, lng: 34.4400, description: 'Hospital partially collapsed' },
    { zone: 'Central Gaza', category: 'blocked_road', lat: 31.4700, lng: 34.4500, description: 'Road to Nuseirat camp blocked' },
    { zone: 'Khan Younis', category: 'rubble', lat: 31.3500, lng: 34.3000, description: 'Market area heavily damaged' },
    { zone: 'Khan Younis', category: 'hazard', lat: 31.3600, lng: 34.3200, description: 'Downed power lines - danger of electrocution' },
    { zone: 'Rafah', category: 'rubble', lat: 31.2800, lng: 34.2500, description: 'Border crossing area damaged' },
    { zone: 'Rafah', category: 'blocked_road', lat: 31.2900, lng: 34.2600, description: 'Evacuation route blocked by rubble' },
  ],
  sudan: [
    { zone: 'Khartoum', category: 'rubble', lat: 15.5900, lng: 32.5400, description: 'Government building collapsed from shelling' },
    { zone: 'Khartoum', category: 'hazard', lat: 15.5700, lng: 32.5200, description: 'Armed conflict zone - avoid area' },
    { zone: 'Khartoum', category: 'blocked_road', lat: 15.6000, lng: 32.5500, description: 'Bridge destroyed by airstrikes' },
    { zone: 'Omdurman', category: 'rubble', lat: 15.6500, lng: 32.4800, description: 'Residential area severely damaged' },
    { zone: 'Omdurman', category: 'hazard', lat: 15.6700, lng: 32.4600, description: 'Unexploded artillery shells reported' },
    { zone: 'Darfur', category: 'rubble', lat: 13.5000, lng: 25.0000, description: 'Village destroyed - mass displacement' },
  ],
  yemen: [
    { zone: 'Sanaa', category: 'rubble', lat: 15.3700, lng: 44.1900, description: 'Historic old city buildings damaged' },
    { zone: 'Sanaa', category: 'hazard', lat: 15.3500, lng: 44.2100, description: 'Hospital without power - medical emergency' },
    { zone: 'Sanaa', category: 'blocked_road', lat: 15.4000, lng: 44.2000, description: 'Main highway blocked by crater' },
    { zone: 'Aden', category: 'rubble', lat: 12.8000, lng: 45.0000, description: 'Port facilities heavily damaged' },
    { zone: 'Aden', category: 'hazard', lat: 12.7800, lng: 45.0200, description: 'Water treatment plant destroyed' },
    { zone: 'Taiz', category: 'rubble', lat: 13.5800, lng: 44.0500, description: 'City center in ruins from siege' },
  ],
  syria: [
    { zone: 'Aleppo', category: 'rubble', lat: 36.2000, lng: 37.1500, description: 'Historic souk completely destroyed' },
    { zone: 'Aleppo', category: 'hazard', lat: 36.1800, lng: 37.1700, description: 'Chemical contamination suspected' },
    { zone: 'Aleppo', category: 'blocked_road', lat: 36.2200, lng: 37.1300, description: 'Major intersection impassable' },
    { zone: 'Damascus', category: 'rubble', lat: 33.5200, lng: 36.3000, description: 'Suburb heavily bombed' },
    { zone: 'Damascus', category: 'hazard', lat: 33.5100, lng: 36.2800, description: 'Sniper activity reported' },
    { zone: 'Idlib', category: 'rubble', lat: 35.9500, lng: 36.6500, description: 'Last hospital in area destroyed' },
  ],
  ukraine: [
    { zone: 'Kyiv', category: 'rubble', lat: 50.4500, lng: 30.5200, description: 'Apartment complex hit by missile' },
    { zone: 'Kyiv', category: 'hazard', lat: 50.4300, lng: 30.5500, description: 'Unexploded missile in residential area' },
    { zone: 'Kyiv', category: 'blocked_road', lat: 50.4700, lng: 30.4800, description: 'Metro station entrance blocked' },
    { zone: 'Kharkiv', category: 'rubble', lat: 50.0000, lng: 36.2500, description: 'University building destroyed' },
    { zone: 'Kharkiv', category: 'hazard', lat: 49.9800, lng: 36.3000, description: 'Gas main ruptured' },
    { zone: 'Mariupol', category: 'rubble', lat: 47.1000, lng: 37.5500, description: 'Theater shelter destroyed - civilians trapped' },
    { zone: 'Mariupol', category: 'hazard', lat: 47.0800, lng: 37.5700, description: 'Steel plant contamination zone' },
    { zone: 'Donetsk', category: 'rubble', lat: 48.0200, lng: 37.8000, description: 'Train station bombed' },
    { zone: 'Bakhmut', category: 'rubble', lat: 48.6000, lng: 38.0000, description: 'City center completely leveled' },
    { zone: 'Bakhmut', category: 'blocked_road', lat: 48.5800, lng: 38.0200, description: 'All roads heavily mined' },
  ],
  afghanistan: [
    { zone: 'Kabul', category: 'rubble', lat: 34.5200, lng: 69.1700, description: 'Mosque destroyed in explosion' },
    { zone: 'Kabul', category: 'hazard', lat: 34.5000, lng: 69.2000, description: 'IED suspected near market' },
    { zone: 'Kabul', category: 'blocked_road', lat: 34.5400, lng: 69.1500, description: 'Security checkpoint blocking traffic' },
    { zone: 'Kandahar', category: 'rubble', lat: 31.6200, lng: 65.7200, description: 'Airstrike damage to civilian homes' },
    { zone: 'Kandahar', category: 'hazard', lat: 31.6000, lng: 65.7000, description: 'Taliban activity - avoid area' },
    { zone: 'Herat', category: 'rubble', lat: 34.3700, lng: 62.2200, description: 'Historic citadel partially collapsed' },
    { zone: 'Mazar-i-Sharif', category: 'rubble', lat: 36.7200, lng: 67.1200, description: 'Shrine complex damaged by fighting' },
  ],
  lebanon: [
    { zone: 'Beirut', category: 'rubble', lat: 33.8900, lng: 35.5000, description: 'Port explosion aftermath - buildings unstable' },
    { zone: 'Beirut', category: 'hazard', lat: 33.8700, lng: 35.5200, description: 'Toxic chemical residue from port blast' },
    { zone: 'Beirut', category: 'blocked_road', lat: 33.9100, lng: 35.4800, description: 'Highway blocked by protests' },
    { zone: 'Tripoli', category: 'rubble', lat: 34.4400, lng: 35.8500, description: 'Old city buildings collapsing' },
    { zone: 'South Lebanon', category: 'hazard', lat: 33.2000, lng: 35.3000, description: 'Border conflict zone - active shelling' },
    { zone: 'South Lebanon', category: 'rubble', lat: 33.1500, lng: 35.4000, description: 'Village destroyed by airstrikes' },
  ],
  somalia: [
    { zone: 'Mogadishu', category: 'rubble', lat: 2.0500, lng: 45.3500, description: 'Market destroyed by car bomb' },
    { zone: 'Mogadishu', category: 'hazard', lat: 2.0300, lng: 45.3700, description: 'Al-Shabaab controlled area' },
    { zone: 'Mogadishu', category: 'blocked_road', lat: 2.0700, lng: 45.3300, description: 'Military checkpoint - long delays' },
    { zone: 'Kismayo', category: 'rubble', lat: -0.3500, lng: 42.5500, description: 'Port facilities damaged' },
    { zone: 'Baidoa', category: 'hazard', lat: 3.1500, lng: 43.6500, description: 'Drought zone - famine conditions' },
  ],
};

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
  const [syncing, setSyncing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>(DEFAULT_REGION);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [voteStats, setVoteStats] = useState<{
    totalVotes: number;
    accurateVotes: number;
    inaccurateVotes: number;
    unclearVotes: number;
    accuracyPercentage: number;
  } | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);
  const mapRef = React.useRef<any>(null);

  const localReports = useReportStore((state) => state.localReports);
  const unsyncedCount = useReportStore((state) => state.unsyncedCount);
  const loadReportsFromDB = useReportStore((state) => state.loadReportsFromDB);
  const { t } = useTranslation();
  const { user, userRole } = useAuth();

  // Load selected region on mount
  useEffect(() => {
    const loadRegion = async () => {
      const storedRegion = await AsyncStorage.getItem('selected_region');
      console.log('MapScreen: Loaded region from storage:', storedRegion || 'none (using default)');
      if (storedRegion) {
        setSelectedRegion(storedRegion.toLowerCase().trim());
      }
      // Check if demo data was already loaded
      const demoLoaded = await AsyncStorage.getItem('demo_data_loaded');
      if (demoLoaded === 'true') {
        setDemoDataLoaded(true);
      }
    };
    loadRegion();
  }, []);

  // Get zones for the selected region
  const regionZones = React.useMemo(() => {
    return getZonesByRegion(selectedRegion).map(z => z.name);
  }, [selectedRegion]);

  // Filter reports based on user role AND selected region
  const filteredReports = React.useMemo(() => {
    console.log('Filtering reports:', { localReportsCount: localReports.length, userRole, userId: user?.id, region: selectedRegion, availableZones: regionZones });
    
    // Filter by region first - only show reports from zones in the selected region
    const regionFilteredReports = localReports.filter(report => {
      const isInZone = regionZones.includes(report.zone);
      if (!isInZone) {
        console.log('Report', report.id, 'zone:', report.zone, 'not in available zones:', regionZones);
      }
      return isInZone;
    });
    
    console.log('Reports after region filter:', regionFilteredReports.length, 'out of', localReports.length);
    
    // For now, show all reports in region regardless of role (for testing)
    return regionFilteredReports;
    
    // Commented out for testing - uncomment when auth is fully set up
    /*
    if (userRole === 'ngo') {
      // NGOs see all reports in region
      return regionFilteredReports;
    }
    // Citizens only see their own reports
    return regionFilteredReports.filter(report => report.user_id === user?.id);
    */
  }, [localReports, userRole, user, regionZones, selectedRegion]);

  useEffect(() => {
    console.log('MapScreen mounted');
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    loadReportsFromDB();
    getUserLocation();

    return () => unsubscribe();
  }, []);

  // Load vote stats when a report is selected
  useEffect(() => {
    if (selectedReport && modalVisible && selectedReport.id) {
      loadVoteStats(selectedReport.id);
    }
  }, [selectedReport, modalVisible]);

  const loadVoteStats = async (reportId: string) => {
    try {
      setVotingLoading(true);
      console.log('Loading vote stats for report:', reportId);
      
      // TODO: When backend is connected, use this:
      // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      // const response = await fetch(`${API_URL}/api/reports/${reportId}/votes`);
      // const data = await response.json();
      // setVoteStats(data.stats);
      
      // For now, fetch directly from Supabase
      const { data: votes, error } = await supabase
        .from('report_votes')
        .select('vote_type')
        .eq('report_id', reportId);

      if (error) {
        console.error('Error fetching votes:', error);
        setVotingLoading(false);
        return;
      }

      const voteArray = votes || [];
      const totalVotes = voteArray.length;
      const accurateVotes = voteArray.filter((v: any) => v.vote_type === 'accurate').length;
      const inaccurateVotes = voteArray.filter((v: any) => v.vote_type === 'inaccurate').length;
      const unclearVotes = voteArray.filter((v: any) => v.vote_type === 'unclear').length;

      const accuracyPercentage = totalVotes > 0 
        ? Math.round((accurateVotes / totalVotes) * 100) 
        : 0;

      setVoteStats({
        totalVotes,
        accurateVotes,
        inaccurateVotes,
        unclearVotes,
        accuracyPercentage,
      });

      // Load user's vote if available
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        const { data: userVoteData } = await supabase
          .from('report_votes')
          .select('vote_type')
          .eq('report_id', reportId)
          .eq('user_id', user.user.id)
          .single();
        
        if (userVoteData) {
          setUserVote(userVoteData.vote_type);
        } else {
          setUserVote(null);
        }
      }

      setVotingLoading(false);
    } catch (error) {
      console.error('Error loading vote stats:', error);
      setVotingLoading(false);
    }
  };

  const submitVote = async (voteType: 'accurate' | 'inaccurate' | 'unclear') => {
    if (!selectedReport) return;
    
    try {
      setVotingLoading(true);
      console.log('Submitting vote:', voteType, 'for report:', selectedReport.id);
      
      // TODO: When backend is connected, use this:
      // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      // const token = await getAuthToken();
      // const response = await fetch(`${API_URL}/api/reports/${selectedReport.id}/vote`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ voteType }),
      // });
      // const data = await response.json();
      
      // For now, use Supabase directly
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        Alert.alert('Authentication Required', 'You must be logged in to vote.');
        setVotingLoading(false);
        return;
      }

      const { error } = await supabase
        .from('report_votes')
        .upsert(
          {
            report_id: selectedReport.id!,
            user_id: user.user.id,
            vote_type: voteType,
          },
          { onConflict: 'report_id,user_id' }
        );

      if (error) {
        console.error('Vote submission error:', error);
        Alert.alert('Error', 'Failed to submit vote. Please try again.');
        setVotingLoading(false);
        return;
      }

      // Update local vote state
      setUserVote(voteType);
      
      // Reload vote stats
      if (selectedReport.id) {
        await loadVoteStats(selectedReport.id);
      }
      
      Alert.alert('Vote Submitted', 'Your vote on report accuracy has been recorded.');
      setVotingLoading(false);
    } catch (error) {
      console.error('Error submitting vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
      setVotingLoading(false);
    }
  };

  const addLocalReport = useReportStore((state) => state.addLocalReport);

  const createDemoReports = async () => {
    // Get demo reports for the currently selected region
    const regionData = DEMO_REPORTS_BY_REGION[selectedRegion] || DEMO_REPORTS_BY_REGION.palestine;
    const regionConfig = getRegionConfig(selectedRegion);
    
    const demoReports: Array<Omit<Report, 'id' | 'synced'>> = regionData.map((report, index) => ({
      zone: report.zone,
      category: report.category as 'rubble' | 'hazard' | 'blocked_road',
      latitude: report.lat,
      longitude: report.lng,
      description: report.description,
      timestamp: Date.now() - (index * 60000), // Stagger timestamps
      is_demo: 1, // Mark as demo to persist during data clearing
    }));

    console.log('Creating', demoReports.length, 'demo reports for region:', selectedRegion);
    let created = 0;
    for (const report of demoReports) {
      try {
        await addLocalReport(report);
        created++;
      } catch (error) {
        console.log('Error creating demo report:', error);
      }
    }
    console.log('Created', created, 'demo reports');
    // Mark demo data as loaded and persist
    setDemoDataLoaded(true);
    await AsyncStorage.setItem('demo_data_loaded', 'true');
    Alert.alert('Demo Data Created', `Added ${created} sample hazard reports for ${regionConfig.name}`);
  };

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

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      console.log('[UI] Manual sync button pressed');
      await manualSync();
      await loadReportsFromDB(); // Refresh UI after sync
      Alert.alert('Sync', 'Reports sync attempt completed. Check console for details.');
    } catch (error) {
      console.error('Manual sync error:', error);
      Alert.alert('Sync Error', 'Failed to sync reports. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
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

              {/* Materials and Hazards Section */}
              {selectedReport.subcategory && (
                <Box bg={COLORS.surface} borderRadius={RADII.md} p={SPACING.md} mb={SPACING.sm}>
                  <VStack space="sm">
                    {(() => {
                      // Parse the subcategory string: "materials:concrete,metal|hazards:uxo,chemicals"
                      const parts = selectedReport.subcategory.split('|');
                      const materialsMatch = parts.find(p => p.startsWith('materials:'));
                      const hazardsMatch = parts.find(p => p.startsWith('hazards:'));
                      
                      const materials = materialsMatch 
                        ? materialsMatch.replace('materials:', '').split(',') 
                        : [];
                      const hazards = hazardsMatch 
                        ? hazardsMatch.replace('hazards:', '').split(',') 
                        : [];

                      return (
                        <>
                          {materials.length > 0 && (
                            <VStack space="xs">
                              <Text fontSize={12} color={COLORS.textSecondary} fontWeight="600">
                                Materials:
                              </Text>
                              <HStack space="xs" flexWrap="wrap">
                                {materials.map((material) => (
                                  <Box
                                    key={material}
                                    bg={COLORS.primary}
                                    borderRadius={RADII.sm}
                                    px={SPACING.sm}
                                    py={SPACING.xs}
                                  >
                                    <Text fontSize={11} color={COLORS.white} fontWeight="600">
                                      {material.charAt(0).toUpperCase() + material.slice(1)}
                                    </Text>
                                  </Box>
                                ))}
                              </HStack>
                            </VStack>
                          )}
                          
                          {hazards.length > 0 && (
                            <VStack space="xs">
                              <Text fontSize={12} color={COLORS.textSecondary} fontWeight="600">
                                Hazards:
                              </Text>
                              <HStack space="xs" flexWrap="wrap">
                                {hazards.map((hazard) => {
                                  const hazardLabel = hazard === 'uxo' ? 'UXOs' 
                                    : hazard === 'bodies' ? 'Human Remains'
                                    : hazard === 'electrical' ? 'Electrical'
                                    : hazard === 'blocked_road' ? 'Blocked Road'
                                    : hazard.charAt(0).toUpperCase() + hazard.slice(1);
                                  
                                  return (
                                    <Box
                                      key={hazard}
                                      bg={hazard === 'uxo' ? '#DC2626' 
                                        : hazard === 'bodies' ? '#7C3AED'
                                        : hazard === 'chemicals' ? '#F59E0B'
                                        : hazard === 'electrical' ? '#EF4444'
                                        : '#92400E'}
                                      borderRadius={RADII.sm}
                                      px={SPACING.sm}
                                      py={SPACING.xs}
                                    >
                                      <Text fontSize={11} color={COLORS.white} fontWeight="600">
                                        {hazardLabel}
                                      </Text>
                                    </Box>
                                  );
                                })}
                              </HStack>
                            </VStack>
                          )}
                        </>
                      );
                    })()}
                  </VStack>
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

              {/* Consensus/Voting Section */}
              <VStack space="sm" py={SPACING.sm}>
                <Text fontSize={12} color={COLORS.textSecondary} fontWeight="600">
                  Community Consensus ({voteStats?.totalVotes || 0} votes)
                </Text>
                
                {voteStats && (
                  <Box bg={COLORS.surface} borderRadius={RADII.md} p={SPACING.md}>
                    <VStack space="sm">
                      {/* Accuracy Percentage Bar */}
                      <HStack space="sm" alignItems="center">
                        <Text fontSize={12} color={COLORS.text} fontWeight="600">
                          Accuracy:
                        </Text>
                        <Box flex={1} bg={COLORS.borderLight} borderRadius={RADII.sm} h={6} overflow="hidden">
                          <Box
                            bg="#10B981"
                            h="100%"
                            w={`${Math.max(voteStats.accuracyPercentage, 5)}%`}
                          />
                        </Box>
                        <Text fontSize={12} color={COLORS.text} fontWeight="600">
                          {voteStats.accuracyPercentage}%
                        </Text>
                      </HStack>

                      {/* Vote Breakdown */}
                      <VStack space="xs" mt={SPACING.sm}>
                        <HStack space="sm" justifyContent="space-between">
                          <HStack space="xs">
                            <Box bg="#10B981" borderRadius={RADII.sm} w={3} h={3} />
                            <Text fontSize={11} color={COLORS.text}>
                              Accurate: {voteStats.accurateVotes}
                            </Text>
                          </HStack>
                          <HStack space="xs">
                            <Box bg="#EF4444" borderRadius={RADII.sm} w={3} h={3} />
                            <Text fontSize={11} color={COLORS.text}>
                              Inaccurate: {voteStats.inaccurateVotes}
                            </Text>
                          </HStack>
                          <HStack space="xs">
                            <Box bg="#F59E0B" borderRadius={RADII.sm} w={3} h={3} />
                            <Text fontSize={11} color={COLORS.text}>
                              Unclear: {voteStats.unclearVotes}
                            </Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Box>
                )}

                {/* Voting Buttons */}
                <VStack space="xs">
                  <Text fontSize={11} color={COLORS.textSecondary}>
                    Is this report accurate?
                  </Text>
                  <HStack space="sm">
                    <Pressable
                      flex={1}
                      bg={userVote === 'accurate' ? '#10B981' : COLORS.surface}
                      borderRadius={RADII.md}
                      py={SPACING.sm}
                      px={SPACING.base}
                      justifyContent="center"
                      alignItems="center"
                      onPress={() => submitVote('accurate')}
                      disabled={votingLoading}
                      opacity={votingLoading ? 0.6 : 1}
                    >
                      <Text
                        fontSize={12}
                        color={userVote === 'accurate' ? COLORS.white : COLORS.text}
                        fontWeight="600"
                      >
                        ✓ Accurate
                      </Text>
                    </Pressable>

                    <Pressable
                      flex={1}
                      bg={userVote === 'inaccurate' ? '#EF4444' : COLORS.surface}
                      borderRadius={RADII.md}
                      py={SPACING.sm}
                      px={SPACING.base}
                      justifyContent="center"
                      alignItems="center"
                      onPress={() => submitVote('inaccurate')}
                      disabled={votingLoading}
                      opacity={votingLoading ? 0.6 : 1}
                    >
                      <Text
                        fontSize={12}
                        color={userVote === 'inaccurate' ? COLORS.white : COLORS.text}
                        fontWeight="600"
                      >
                        ✗ Inaccurate
                      </Text>
                    </Pressable>

                    <Pressable
                      flex={1}
                      bg={userVote === 'unclear' ? '#F59E0B' : COLORS.surface}
                      borderRadius={RADII.md}
                      py={SPACING.sm}
                      px={SPACING.base}
                      justifyContent="center"
                      alignItems="center"
                      onPress={() => submitVote('unclear')}
                      disabled={votingLoading}
                      opacity={votingLoading ? 0.6 : 1}
                    >
                      <Text
                        fontSize={12}
                        color={userVote === 'unclear' ? COLORS.white : COLORS.text}
                        fontWeight="600"
                      >
                        ? Unclear
                      </Text>
                    </Pressable>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth={1} borderTopColor={COLORS.borderLight} pt={SPACING.base}>
            <VStack space="sm" w="100%">
              {/* Go to Location Button */}
              <Pressable
                bg={COLORS.primary}
                borderRadius={RADII.md}
                py={SPACING.md}
                px={SPACING.lg}
                justifyContent="center"
                alignItems="center"
                onPress={() => {
                  if (selectedReport) {
                    setFlyToLocation({ lat: selectedReport.latitude, lng: selectedReport.longitude });
                    setViewMode('map');
                    setModalVisible(false);
                  }
                }}
                style={SHADOWS.sm}
              >
                <HStack space="sm" alignItems="center">
                  <Navigation2 size={18} color={COLORS.white} />
                  <Text fontSize={14} color={COLORS.white} fontWeight="600">
                    Go to Location
                  </Text>
                </HStack>
              </Pressable>
              
              <HStack space="sm" w="100%">
                <Box flex={1}>
                  <PrimaryButton
                    onPress={() => setModalVisible(false)}
                    label={t('map.close')}
                    variant="secondary"
                  />
                </Box>
              </HStack>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const emptyListComponent = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={SPACING['3xl']} px={SPACING.lg}>
      <VStack space="md" alignItems="center">
        <Icons.Empty size={64} color={COLORS.textMuted} />
        <Heading fontSize={20} color={COLORS.text} textAlign="center">
          {t('map.noReports')}
        </Heading>
        <Text fontSize={14} color={COLORS.textSecondary} textAlign="center" px={SPACING.lg}>
          {t('map.noReportsText')}
        </Text>
        
        {/* Demo Reports Button - only show if demo data not loaded */}
        {!demoDataLoaded && (
          <Pressable
            onPress={createDemoReports}
            style={{
              marginTop: SPACING.lg,
              backgroundColor: COLORS.primary,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.md,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }}>
              Load Demo Reports
            </Text>
          </Pressable>
        )}
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
          {/* View Mode Toggle + Demo Button */}
          <HStack space="sm" alignItems="center">
            {/* Sync Button - show when there are unsynced reports */}
            {unsyncedCount > 0 && (
              <Pressable
                onPress={handleManualSync}
                bg={COLORS.primary}
                borderRadius={RADII.md}
                p={SPACING.sm}
                disabled={syncing}
                opacity={syncing ? 0.6 : 1}
              >
                <HStack space="xs" alignItems="center">
                  <RefreshCw 
                    size={14} 
                    color={COLORS.white} 
                    style={{ 
                      transform: syncing ? [{ rotate: '360deg' }] : [],
                      opacity: syncing ? 0.7 : 1
                    }}
                  />
                  <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 12 }}>
                    {syncing ? 'Syncing...' : 'Sync'}
                  </Text>
                </HStack>
              </Pressable>
            )}
            {/* Demo Data Button - only show if demo data not loaded */}
            {!demoDataLoaded && (
              <Pressable
                onPress={createDemoReports}
                bg={COLORS.success}
                borderRadius={RADII.md}
                p={SPACING.sm}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 12 }}>+ Demo</Text>
              </Pressable>
            )}
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
            regionKey={selectedRegion}
            flyToLocation={flyToLocation}
            onFlyComplete={() => setFlyToLocation(null)}
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
