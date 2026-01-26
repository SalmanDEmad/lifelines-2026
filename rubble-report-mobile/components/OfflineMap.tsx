import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Box, Text, VStack, HStack, Pressable } from '../components';
import { MapPin, Navigation, AlertTriangle, List } from 'lucide-react-native';
import { Report } from '../utils/database';
import { useTranslation } from '../utils/i18n';
import { COLORS, SPACING, RADII, SHADOWS } from '../design';

// Check if running in Expo Go (MapLibre won't work there)
const isExpoGo = Constants.appOwnership === 'expo';

// Only try to import MapLibre if NOT in Expo Go
let MapLibreGL: any = null;
let isMapLibreAvailable = false;

if (!isExpoGo) {
  try {
    const maplibre = require('@maplibre/maplibre-react-native');
    MapLibreGL = maplibre.default;
    if (MapLibreGL) {
      MapLibreGL.setAccessToken(null);
      isMapLibreAvailable = true;
    }
  } catch (e) {
    console.log('MapLibre not available');
  }
}

// OpenStreetMap style URL
const OSM_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Gaza center coordinates
const GAZA_CENTER = {
  longitude: 34.45,
  latitude: 31.45,
};

// Category colors for markers
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'rubble': return '#EF4444';
    case 'hazard': return '#F59E0B';
    case 'blocked_road': return '#3B82F6';
    default: return COLORS.primary;
  }
};

interface OfflineMapProps {
  reports: Report[];
  onReportPress?: (report: Report) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function OfflineMap({ reports, onReportPress, userLocation }: OfflineMapProps) {
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { t } = useTranslation();

  const centerOnUser = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 15,
        animationDuration: 500,
      });
    } else {
      Alert.alert(t('report.locationUnavailable'));
    }
  };

  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report);
    if (onReportPress) {
      onReportPress(report);
    }
  };

  // Fallback view when MapLibre is not available (Expo Go)
  if (!isMapLibreAvailable || isExpoGo) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <AlertTriangle size={48} color={COLORS.warning} />
          <Text style={styles.fallbackTitle}>{t('map.mapUnavailable') || 'Map Not Available'}</Text>
          <Text style={styles.fallbackText}>
            {t('map.mapUnavailableText') || 'The map requires a development build. Use the list view to see your reports.'}
          </Text>
          
          {/* Show report count */}
          <View style={styles.reportStats}>
            <Text style={styles.reportCount}>{reports.length}</Text>
            <Text style={styles.reportLabel}>{t('map.reports') || 'Reports'}</Text>
          </View>
          
          {/* List reports by category */}
          <View style={styles.categoryBreakdown}>
            {['rubble', 'hazard', 'blocked_road'].map(category => {
              const count = reports.filter(r => r.category === category).length;
              if (count === 0) return null;
              return (
                <HStack key={category} space="sm" alignItems="center" style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={styles.categoryText}>{t(`categories.${category}`)}: {count}</Text>
                </HStack>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={OSM_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [GAZA_CENTER.longitude, GAZA_CENTER.latitude],
            zoomLevel: 11,
          }}
        />

        {/* User Location */}
        {userLocation && (
          <MapLibreGL.PointAnnotation
            id="user-location"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Report Markers */}
        {reports.filter(report => report.id).map((report) => (
          <MapLibreGL.PointAnnotation
            key={report.id!}
            id={report.id!}
            coordinate={[report.longitude, report.latitude]}
            onSelected={() => handleMarkerPress(report)}
          >
            <View style={[styles.marker, { backgroundColor: getCategoryColor(report.category) }]}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
            <MapLibreGL.Callout title={t(`categories.${report.category}`)} />
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.controlButton}
          onPress={centerOnUser}
        >
          <Navigation size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Selected Report Info */}
      {selectedReport && (
        <Box style={styles.infoCard}>
          <HStack space="sm" alignItems="center">
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(selectedReport.category) }]} />
            <VStack flex={1}>
              <Text fontWeight="600" color={COLORS.text}>
                {t(`categories.${selectedReport.category}`)}
              </Text>
              {selectedReport.description && (
                <Text fontSize={12} color={COLORS.textSecondary} numberOfLines={2}>
                  {selectedReport.description}
                </Text>
              )}
            </VStack>
            <Pressable onPress={() => setSelectedReport(null)}>
              <Text color={COLORS.primary} fontWeight="600">✕</Text>
            </Pressable>
          </HStack>
        </Box>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.md,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    gap: SPACING.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  infoCard: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Fallback view styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  reportStats: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  reportCount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reportLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryBreakdown: {
    marginTop: SPACING.lg,
    alignItems: 'flex-start',
  },
  categoryRow: {
    marginVertical: SPACING.xs,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
