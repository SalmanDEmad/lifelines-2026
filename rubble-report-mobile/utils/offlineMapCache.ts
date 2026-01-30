import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { REGIONS } from './zones';

const TILE_CACHE_DIR = `${FileSystem.cacheDirectory}map-tiles/`;
const CACHE_METADATA_KEY = 'offline_map_cache_metadata';

// Tile server URL (OpenStreetMap style tiles)
const TILE_SERVER = 'https://tile.openstreetmap.org';

// Maximum tiles to cache per region (to manage storage)
const MAX_TILES_PER_REGION = 500;

// Zoom levels to cache (higher = more detail but more tiles)
const CACHE_ZOOM_LEVELS = [10, 12, 14, 16]; // Good balance for navigation

interface CacheMetadata {
  regions: {
    [regionKey: string]: {
      tilesCount: number;
      lastUpdated: string;
      zoomLevels: number[];
      sizeBytes: number;
    };
  };
  totalSizeBytes: number;
}

interface TileBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Convert lat/lng to tile coordinates at a given zoom level
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Get tile bounds for a region at a given zoom level
 */
function getRegionTileBounds(regionKey: string, zoom: number): TileBounds | null {
  const region = REGIONS[regionKey];
  if (!region || !region.bounds) {
    // Use center with approximate bounds if no explicit bounds
    if (!region?.center) return null;
    const [centerLat, centerLng] = region.center;
    const delta = 0.5 / Math.pow(2, zoom - 10); // Approximate bounds based on zoom
    const minTile = latLngToTile(centerLat + delta, centerLng - delta, zoom);
    const maxTile = latLngToTile(centerLat - delta, centerLng + delta, zoom);
    return {
      minX: Math.min(minTile.x, maxTile.x),
      maxX: Math.max(minTile.x, maxTile.x),
      minY: Math.min(minTile.y, maxTile.y),
      maxY: Math.max(minTile.y, maxTile.y),
    };
  }
  
  const [minLat, minLng, maxLat, maxLng] = region.bounds;
  const minTile = latLngToTile(maxLat, minLng, zoom);
  const maxTile = latLngToTile(minLat, maxLng, zoom);
  
  return {
    minX: minTile.x,
    maxX: maxTile.x,
    minY: minTile.y,
    maxY: maxTile.y,
  };
}

/**
 * Get tile URL
 */
function getTileUrl(x: number, y: number, z: number): string {
  return `${TILE_SERVER}/${z}/${x}/${y}.png`;
}

/**
 * Get local tile path
 */
function getTilePath(x: number, y: number, z: number): string {
  return `${TILE_CACHE_DIR}${z}/${x}/${y}.png`;
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TILE_CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get cache metadata
 */
async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading cache metadata:', error);
  }
  return { regions: {}, totalSizeBytes: 0 };
}

/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata: CacheMetadata): Promise<void> {
  await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
}

/**
 * Download a single tile
 */
async function downloadTile(x: number, y: number, z: number): Promise<number> {
  const url = getTileUrl(x, y, z);
  const path = getTilePath(x, y, z);
  
  // Ensure directory exists
  const dir = `${TILE_CACHE_DIR}${z}/${x}/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  
  try {
    const downloadResult = await FileSystem.downloadAsync(url, path, {
      headers: {
        'User-Agent': 'Lifelines-App/1.0',
      },
    });
    
    if (downloadResult.status === 200) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      return (fileInfo as any).size || 0;
    }
    return 0;
  } catch (error) {
    console.log(`Failed to download tile ${z}/${x}/${y}:`, error);
    return 0;
  }
}

/**
 * Download map tiles for a region
 * @param regionKey - Region to cache (e.g., 'palestine', 'sudan')
 * @param onProgress - Progress callback (0-100)
 * @returns Total tiles downloaded
 */
export async function downloadRegionTiles(
  regionKey: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ success: boolean; tilesDownloaded: number; sizeBytes: number }> {
  try {
    // Check network
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      onProgress?.(0, 'No internet connection');
      return { success: false, tilesDownloaded: 0, sizeBytes: 0 };
    }

    await ensureCacheDir();

    onProgress?.(5, 'Calculating tiles to download...');

    // Calculate all tiles to download
    const tilesToDownload: Array<{ x: number; y: number; z: number }> = [];
    
    for (const zoom of CACHE_ZOOM_LEVELS) {
      const bounds = getRegionTileBounds(regionKey, zoom);
      if (!bounds) continue;
      
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
          tilesToDownload.push({ x, y, z: zoom });
          
          // Limit tiles per region
          if (tilesToDownload.length >= MAX_TILES_PER_REGION) {
            break;
          }
        }
        if (tilesToDownload.length >= MAX_TILES_PER_REGION) break;
      }
      if (tilesToDownload.length >= MAX_TILES_PER_REGION) break;
    }

    if (tilesToDownload.length === 0) {
      onProgress?.(100, 'No tiles to download for this region');
      return { success: true, tilesDownloaded: 0, sizeBytes: 0 };
    }

    onProgress?.(10, `Downloading ${tilesToDownload.length} tiles...`);

    let downloaded = 0;
    let totalSize = 0;
    const batchSize = 5; // Download 5 tiles at a time

    for (let i = 0; i < tilesToDownload.length; i += batchSize) {
      const batch = tilesToDownload.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(tile => downloadTile(tile.x, tile.y, tile.z))
      );
      
      downloaded += batch.length;
      totalSize += results.reduce((sum, size) => sum + size, 0);
      
      const progress = 10 + Math.round((downloaded / tilesToDownload.length) * 85);
      onProgress?.(progress, `Downloaded ${downloaded}/${tilesToDownload.length} tiles`);
      
      // Small delay to not overwhelm the tile server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update metadata
    const metadata = await getCacheMetadata();
    metadata.regions[regionKey] = {
      tilesCount: downloaded,
      lastUpdated: new Date().toISOString(),
      zoomLevels: CACHE_ZOOM_LEVELS,
      sizeBytes: totalSize,
    };
    metadata.totalSizeBytes = Object.values(metadata.regions).reduce(
      (sum, r) => sum + r.sizeBytes, 0
    );
    await saveCacheMetadata(metadata);

    onProgress?.(100, `Downloaded ${downloaded} tiles (${formatBytes(totalSize)})`);

    return { success: true, tilesDownloaded: downloaded, sizeBytes: totalSize };
  } catch (error) {
    console.error('Error downloading region tiles:', error);
    onProgress?.(0, 'Download failed');
    return { success: false, tilesDownloaded: 0, sizeBytes: 0 };
  }
}

/**
 * Check if a tile is cached
 */
export async function isTileCached(x: number, y: number, z: number): Promise<boolean> {
  const path = getTilePath(x, y, z);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

/**
 * Get cached tile as base64 (for map display)
 */
export async function getCachedTileBase64(x: number, y: number, z: number): Promise<string | null> {
  const path = getTilePath(x, y, z);
  const info = await FileSystem.getInfoAsync(path);
  
  if (!info.exists) return null;
  
  try {
    const base64 = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Get cache status for a region
 */
export async function getRegionCacheStatus(regionKey: string): Promise<{
  isCached: boolean;
  tilesCount: number;
  sizeBytes: number;
  lastUpdated: string | null;
}> {
  const metadata = await getCacheMetadata();
  const regionData = metadata.regions[regionKey];
  
  if (!regionData) {
    return { isCached: false, tilesCount: 0, sizeBytes: 0, lastUpdated: null };
  }
  
  return {
    isCached: true,
    tilesCount: regionData.tilesCount,
    sizeBytes: regionData.sizeBytes,
    lastUpdated: regionData.lastUpdated,
  };
}

/**
 * Get total cache size
 */
export async function getTotalCacheSize(): Promise<number> {
  const metadata = await getCacheMetadata();
  return metadata.totalSizeBytes;
}

/**
 * Clear cached tiles for a region
 */
export async function clearRegionCache(regionKey: string): Promise<void> {
  try {
    const metadata = await getCacheMetadata();
    
    if (metadata.regions[regionKey]) {
      // Clear from metadata
      const regionSize = metadata.regions[regionKey].sizeBytes;
      delete metadata.regions[regionKey];
      metadata.totalSizeBytes -= regionSize;
      await saveCacheMetadata(metadata);
    }
    
    // Note: We don't actually delete files as they may be shared across regions
    // The cache will be naturally cleaned up by the system when storage is needed
  } catch (error) {
    console.error('Error clearing region cache:', error);
  }
}

/**
 * Clear all cached tiles
 */
export async function clearAllCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(TILE_CACHE_DIR, { idempotent: true });
    }
    await saveCacheMetadata({ regions: {}, totalSizeBytes: 0 });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if we have enough tiles for offline use
 */
export async function isRegionAvailableOffline(regionKey: string): Promise<boolean> {
  const status = await getRegionCacheStatus(regionKey);
  // Consider region available if we have at least 50 tiles
  return status.tilesCount >= 50;
}

export { formatBytes };
