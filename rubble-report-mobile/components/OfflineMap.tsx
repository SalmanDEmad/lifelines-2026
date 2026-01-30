import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, VStack, HStack, Pressable } from '../components';
import { Navigation } from 'lucide-react-native';
import { Report } from '../utils/database';
import { COLORS, SPACING, RADII, SHADOWS } from '../design';
import { getRegionConfig, DEFAULT_REGION } from '../utils/zones';
import { getTwemojiUrl } from '../utils/emoji';

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
  regionKey?: string; // Optional region override
  flyToLocation?: { lat: number; lng: number } | null; // Fly to specific location
  onFlyComplete?: () => void; // Callback when fly animation completes
}

export default function OfflineMap({ reports, onReportPress, userLocation, regionKey, flyToLocation, onFlyComplete }: OfflineMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(regionKey?.toLowerCase().trim() || DEFAULT_REGION);
  const [regionLoaded, setRegionLoaded] = useState(!!regionKey); // If regionKey is passed, we're ready

  // Load selected region from AsyncStorage on mount
  useEffect(() => {
    const loadRegion = async () => {
      if (!regionKey) {
        const storedRegion = await AsyncStorage.getItem('selected_region');
        console.log('OfflineMap: Loaded region from storage:', storedRegion || 'none (using default)');
        if (storedRegion) {
          setSelectedRegion(storedRegion.toLowerCase().trim());
        }
      }
      setRegionLoaded(true);
    };
    loadRegion();
  }, [regionKey]);

  // Update selectedRegion when regionKey prop changes
  useEffect(() => {
    if (regionKey) {
      console.log('OfflineMap: Region prop changed to:', regionKey);
      setSelectedRegion(regionKey.toLowerCase().trim());
    }
  }, [regionKey]);

  // Get region configuration
  const regionConfig = getRegionConfig(selectedRegion);
  console.log('OfflineMap: Using region:', selectedRegion, 'Center:', regionConfig.center);

  // Get bounds for map restriction
  const mapBounds = regionConfig.bounds;

  // Check if user location is within the selected region bounds
  const isUserInRegion = userLocation && 
    regionConfig.bounds &&
    userLocation.latitude >= regionConfig.bounds.minLat &&
    userLocation.latitude <= regionConfig.bounds.maxLat &&
    userLocation.longitude >= regionConfig.bounds.minLng &&
    userLocation.longitude <= regionConfig.bounds.maxLng;

  // Calculate center and zoom - ALWAYS use region center for initial view
  const getMapCenter = () => {
    // ALWAYS use region center for initial view
    // Reports will be shown as markers, but don't pan to them automatically
    console.log('OfflineMap: Using region center:', regionConfig.center);
    return { 
      lat: regionConfig.center.latitude, 
      lng: regionConfig.center.longitude, 
      zoom: regionConfig.defaultZoom 
    };
  };

  const center = getMapCenter();
  console.log('OfflineMap: Final center:', center);

  // Generate GeoJSON for markers
  const markersGeoJSON = {
    type: 'FeatureCollection',
    features: reports.map((report) => ({
      type: 'Feature',
      properties: {
        id: report.id,
        category: report.category,
        description: report.description || '',
        color: getCategoryColor(report.category),
        title: report.category.replace(/_/g, ' '),
      },
      geometry: {
        type: 'Point',
        coordinates: [report.longitude, report.latitude],
      },
    })),
  };

  // User location GeoJSON - always show for development/testing
  // In production, you might want to only show if isUserInRegion is true
  const userLocationGeoJSON = userLocation ? {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { type: 'user', inRegion: isUserInRegion },
      geometry: {
        type: 'Point',
        coordinates: [userLocation.longitude, userLocation.latitude],
      },
    }],
  } : { type: 'FeatureCollection', features: [] };

  // MapLibre GL JS HTML - add timestamp to prevent caching
  const timestamp = Date.now();
  
  // Generate Twemoji URLs for categories
  const rubbleEmojiUrl = getTwemojiUrl('🧱');
  const hazardEmojiUrl = getTwemojiUrl('⚠️');
  const blockedRoadEmojiUrl = getTwemojiUrl('🚧');
  const defaultEmojiUrl = getTwemojiUrl('📍');
  
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>MapLibre Map - ${timestamp}</title>
  <script src="https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    
    .marker-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 8px 12px;
      max-width: 200px;
    }
    .marker-popup h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      text-transform: capitalize;
    }
    .marker-popup p {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    .maplibregl-popup-content {
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .maplibregl-popup-close-button {
      font-size: 18px;
      padding: 4px 8px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markersData = ${JSON.stringify(markersGeoJSON)};
    const userLocationData = ${JSON.stringify(userLocationGeoJSON)};
    const initialCenter = [${center.lng}, ${center.lat}];
    const initialZoom = ${center.zoom};
    const regionBounds = [[${mapBounds.minLng}, ${mapBounds.minLat}], [${mapBounds.maxLng}, ${mapBounds.maxLat}]];

    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: initialCenter,
      zoom: initialZoom,
      maxBounds: regionBounds,
      attributionControl: false
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');

    map.on('load', () => {
      // Load Twemoji images for markers
      map.loadImage('${rubbleEmojiUrl}', (error, image) => {
        if (!error && image) map.addImage('rubble-emoji', image);
      });
      map.loadImage('${hazardEmojiUrl}', (error, image) => {
        if (!error && image) map.addImage('hazard-emoji', image);
      });
      map.loadImage('${blockedRoadEmojiUrl}', (error, image) => {
        if (!error && image) map.addImage('blocked-road-emoji', image);
      });
      map.loadImage('${defaultEmojiUrl}', (error, image) => {
        if (!error && image) map.addImage('default-emoji', image);
      });

      // Add report markers source
      map.addSource('reports', {
        type: 'geojson',
        data: markersData
      });

      // Add circle layer for markers
      map.addLayer({
        id: 'reports-circles',
        type: 'circle',
        source: 'reports',
        paint: {
          'circle-radius': 12,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 3,
          'circle-opacity': 0.9
        }
      });

      // Add Twemoji icon layer for markers
      map.addLayer({
        id: 'reports-labels',
        type: 'symbol',
        source: 'reports',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'category'], 'rubble'], 'rubble-emoji',
            ['==', ['get', 'category'], 'hazard'], 'hazard-emoji',
            ['==', ['get', 'category'], 'blocked_road'], 'blocked-road-emoji',
            'default-emoji'
          ],
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'icon-offset': [0, -12]
        }
      });

      // Add user location source if available
      if (userLocationData.features.length > 0) {
        map.addSource('user-location', {
          type: 'geojson',
          data: userLocationData
        });

        // Pulsing blue dot for user
        map.addLayer({
          id: 'user-location-pulse',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 20,
            'circle-color': '#3B82F6',
            'circle-opacity': 0.2
          }
        });

        map.addLayer({
          id: 'user-location-dot',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 8,
            'circle-color': '#3B82F6',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 3
          }
        });
      }

      // Send ready message to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    });

    // Handle marker clicks
    map.on('click', 'reports-circles', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;
        const coords = feature.geometry.coordinates.slice();

        // Create popup
        new maplibregl.Popup({ offset: 15 })
          .setLngLat(coords)
          .setHTML(\`
            <div class="marker-popup">
              <h3>\${props.title}</h3>
              <p>\${props.description || 'No description'}</p>
            </div>
          \`)
          .addTo(map);

        // Send click event to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          id: props.id,
          category: props.category,
          description: props.description
        }));
      }
    });

    // Change cursor on hover
    map.on('mouseenter', 'reports-circles', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'reports-circles', () => {
      map.getCanvas().style.cursor = '';
    });

    // Handle commands from React Native
    window.handleCommand = function(command) {
      if (command.type === 'flyTo') {
        map.flyTo({
          center: [command.lng, command.lat],
          zoom: command.zoom || 15,
          duration: 1000
        });
      } else if (command.type === 'updateMarkers') {
        const source = map.getSource('reports');
        if (source) {
          source.setData(command.data);
        }
      }
    };

    // Listen for messages from React Native
    document.addEventListener('message', (event) => {
      try {
        const command = JSON.parse(event.data);
        window.handleCommand(command);
      } catch (e) {}
    });
    window.addEventListener('message', (event) => {
      try {
        const command = JSON.parse(event.data);
        window.handleCommand(command);
      } catch (e) {}
    });
  </script>
</body>
</html>
`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
      } else if (data.type === 'markerClick') {
        const report = reports.find(r => r.id === data.id);
        if (report) {
          setSelectedReport(report);
          if (onReportPress) {
            onReportPress(report);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse WebView message:', e);
    }
  };

  const centerOnUser = () => {
    if (!userLocation) {
      Alert.alert('Location Unavailable', 'Unable to get your current location.');
      return;
    }
    
    if (!isUserInRegion) {
      // User is outside the selected region - center on region instead
      Alert.alert(
        'Outside Region', 
        `You are currently outside the selected region (${regionConfig.name}). Centering on region instead.`
      );
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'flyTo',
          lat: regionConfig.center.latitude,
          lng: regionConfig.center.longitude,
          zoom: regionConfig.defaultZoom
        }));
      }
      return;
    }
    
    // User is within the region - center on their location
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'flyTo',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        zoom: 15
      }));
    }
  };

  // Update markers when reports change
  useEffect(() => {
    if (mapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateMarkers',
        data: markersGeoJSON
      }));
    }
  }, [reports, mapReady]);

  // Handle flyToLocation prop changes
  useEffect(() => {
    if (mapReady && webViewRef.current && flyToLocation) {
      console.log('OfflineMap: Flying to location:', flyToLocation);
      webViewRef.current.postMessage(JSON.stringify({
        type: 'flyTo',
        lat: flyToLocation.lat,
        lng: flyToLocation.lng,
        zoom: 22 // Zoom in very close for precise location view
      }));
      // Call onFlyComplete after animation
      if (onFlyComplete) {
        setTimeout(() => onFlyComplete(), 1500);
      }
    }
  }, [flyToLocation, mapReady]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={`map-${selectedRegion}-${timestamp}`}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        cacheEnabled={false}
        incognito={true}
        geolocationEnabled={false}
      />

      {/* Map Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={centerOnUser}>
          <Navigation size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Selected Report Info Card */}
      {selectedReport && (
        <View style={styles.infoCard}>
          <HStack space="sm" alignItems="flex-start">
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(selectedReport.category) }]} />
            <VStack flex={1}>
              <Text style={{ fontWeight: '600', color: COLORS.text }}>
                {selectedReport.category.replace(/_/g, ' ')}
              </Text>
              {selectedReport.description && (
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }} numberOfLines={2}>
                  {selectedReport.description}
                </Text>
              )}
            </VStack>
            <Pressable onPress={() => setSelectedReport(null)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>✕</Text>
            </Pressable>
          </HStack>
        </View>
      )}

      {/* Report count badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{reports.length} Reports</Text>
      </View>
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
    bottom: 100,
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
  badge: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    ...SHADOWS.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
