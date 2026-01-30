// Regions/Countries with map center coordinates and bounds
import { getTwemojiUrl } from './emoji';

export const REGIONS = {
  'palestine': {
    name: 'Palestine',
    nameAr: 'فلسطين',
    flag: '🇵🇸',
    flagUrl: getTwemojiUrl('🇵🇸'),
    center: { latitude: 31.45, longitude: 34.40 },
    bounds: { minLat: 31.20, maxLat: 31.60, minLng: 34.20, maxLng: 34.60 },
    defaultZoom: 11,
  },
  'sudan': {
    name: 'Sudan',
    nameAr: 'السودان',
    flag: '🇸🇩',
    flagUrl: getTwemojiUrl('🇸🇩'),
    center: { latitude: 15.55, longitude: 32.53 },
    bounds: { minLat: 12.0, maxLat: 20.0, minLng: 22.0, maxLng: 39.0 },
    defaultZoom: 6,
  },
  'yemen': {
    name: 'Yemen',
    nameAr: 'اليمن',
    flag: '🇾🇪',
    flagUrl: getTwemojiUrl('🇾🇪'),
    center: { latitude: 15.37, longitude: 44.19 },
    bounds: { minLat: 12.0, maxLat: 18.0, minLng: 42.0, maxLng: 54.0 },
    defaultZoom: 7,
  },
  'syria': {
    name: 'Syria',
    nameAr: 'سوريا',
    flag: '🇸🇾',
    flagUrl: getTwemojiUrl('🇸🇾'),
    center: { latitude: 35.0, longitude: 38.0 },
    bounds: { minLat: 32.0, maxLat: 37.5, minLng: 35.5, maxLng: 42.5 },
    defaultZoom: 7,
  },
  'ukraine': {
    name: 'Ukraine',
    nameAr: 'أوكرانيا',
    flag: '🇺🇦',
    flagUrl: getTwemojiUrl('🇺🇦'),
    center: { latitude: 48.38, longitude: 37.62 },
    bounds: { minLat: 44.0, maxLat: 52.5, minLng: 22.0, maxLng: 40.5 },
    defaultZoom: 6,
  },
  'afghanistan': {
    name: 'Afghanistan',
    nameAr: 'أفغانستان',
    flag: '🇦🇫',
    flagUrl: getTwemojiUrl('🇦🇫'),
    center: { latitude: 34.52, longitude: 69.17 },
    bounds: { minLat: 29.0, maxLat: 38.5, minLng: 60.0, maxLng: 75.0 },
    defaultZoom: 6,
  },
  'lebanon': {
    name: 'Lebanon',
    nameAr: 'لبنان',
    flag: '🇱🇧',
    flagUrl: getTwemojiUrl('🇱🇧'),
    center: { latitude: 33.89, longitude: 35.50 },
    bounds: { minLat: 33.0, maxLat: 34.7, minLng: 35.0, maxLng: 36.7 },
    defaultZoom: 9,
  },
  'somalia': {
    name: 'Somalia',
    nameAr: 'الصومال',
    flag: '🇸🇴',
    flagUrl: getTwemojiUrl('🇸🇴'),
    center: { latitude: 2.05, longitude: 45.34 },
    bounds: { minLat: -1.5, maxLat: 12.0, minLng: 40.5, maxLng: 51.5 },
    defaultZoom: 6,
  },
};

export const ZONES = {
  // Palestine - Gaza
  'North Gaza': {
    name: 'North Gaza',
    nameAr: 'شمال غزة',
    region: 'palestine',
    minLat: 31.54,
    maxLat: 31.64,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Gaza City': {
    name: 'Gaza City',
    nameAr: 'مدينة غزة',
    region: 'palestine',
    minLat: 31.5,
    maxLat: 31.54,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Central Gaza': {
    name: 'Central Gaza',
    nameAr: 'وسط غزة',
    region: 'palestine',
    minLat: 31.43,
    maxLat: 31.5,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Khan Younis': {
    name: 'Khan Younis',
    nameAr: 'خان يونس',
    region: 'palestine',
    minLat: 31.34,
    maxLat: 31.43,
    minLng: 34.3,
    maxLng: 34.53,
  },
  'Rafah': {
    name: 'Rafah',
    nameAr: 'رفح',
    region: 'palestine',
    minLat: 31.25,
    maxLat: 31.34,
    minLng: 34.23,
    maxLng: 34.53,
  },
  // Sudan
  'Khartoum': {
    name: 'Khartoum',
    nameAr: 'الخرطوم',
    region: 'sudan',
    minLat: 15.45,
    maxLat: 15.70,
    minLng: 32.45,
    maxLng: 32.65,
  },
  'Omdurman': {
    name: 'Omdurman',
    nameAr: 'أم درمان',
    region: 'sudan',
    minLat: 15.60,
    maxLat: 15.75,
    minLng: 32.40,
    maxLng: 32.55,
  },
  'Darfur': {
    name: 'Darfur',
    nameAr: 'دارفور',
    region: 'sudan',
    minLat: 12.0,
    maxLat: 16.0,
    minLng: 22.0,
    maxLng: 27.0,
  },
  // Yemen
  'Sanaa': {
    name: "Sana'a",
    nameAr: 'صنعاء',
    region: 'yemen',
    minLat: 15.30,
    maxLat: 15.45,
    minLng: 44.15,
    maxLng: 44.25,
  },
  'Aden': {
    name: 'Aden',
    nameAr: 'عدن',
    region: 'yemen',
    minLat: 12.75,
    maxLat: 12.85,
    minLng: 44.95,
    maxLng: 45.10,
  },
  'Taiz': {
    name: 'Taiz',
    nameAr: 'تعز',
    region: 'yemen',
    minLat: 13.55,
    maxLat: 13.65,
    minLng: 44.00,
    maxLng: 44.10,
  },
  // Syria
  'Aleppo': {
    name: 'Aleppo',
    nameAr: 'حلب',
    region: 'syria',
    minLat: 36.15,
    maxLat: 36.25,
    minLng: 37.10,
    maxLng: 37.20,
  },
  'Damascus': {
    name: 'Damascus',
    nameAr: 'دمشق',
    region: 'syria',
    minLat: 33.50,
    maxLat: 33.55,
    minLng: 36.25,
    maxLng: 36.35,
  },
  'Idlib': {
    name: 'Idlib',
    nameAr: 'إدلب',
    region: 'syria',
    minLat: 35.90,
    maxLat: 36.00,
    minLng: 36.60,
    maxLng: 36.70,
  },
  // Ukraine
  'Kyiv': {
    name: 'Kyiv',
    nameAr: 'كييف',
    region: 'ukraine',
    minLat: 50.35,
    maxLat: 50.55,
    minLng: 30.40,
    maxLng: 30.70,
  },
  'Kharkiv': {
    name: 'Kharkiv',
    nameAr: 'خاركيف',
    region: 'ukraine',
    minLat: 49.90,
    maxLat: 50.10,
    minLng: 36.15,
    maxLng: 36.40,
  },
  'Mariupol': {
    name: 'Mariupol',
    nameAr: 'ماريوبول',
    region: 'ukraine',
    minLat: 47.05,
    maxLat: 47.15,
    minLng: 37.50,
    maxLng: 37.65,
  },
  'Donetsk': {
    name: 'Donetsk',
    nameAr: 'دونيتسك',
    region: 'ukraine',
    minLat: 47.95,
    maxLat: 48.10,
    minLng: 37.75,
    maxLng: 37.90,
  },
  'Bakhmut': {
    name: 'Bakhmut',
    nameAr: 'باخموت',
    region: 'ukraine',
    minLat: 48.55,
    maxLat: 48.65,
    minLng: 37.95,
    maxLng: 38.10,
  },
  // Afghanistan
  'Kabul': {
    name: 'Kabul',
    nameAr: 'كابول',
    region: 'afghanistan',
    minLat: 34.45,
    maxLat: 34.60,
    minLng: 69.10,
    maxLng: 69.30,
  },
  'Kandahar': {
    name: 'Kandahar',
    nameAr: 'قندهار',
    region: 'afghanistan',
    minLat: 31.55,
    maxLat: 31.70,
    minLng: 65.65,
    maxLng: 65.80,
  },
  'Herat': {
    name: 'Herat',
    nameAr: 'هرات',
    region: 'afghanistan',
    minLat: 34.30,
    maxLat: 34.45,
    minLng: 62.15,
    maxLng: 62.30,
  },
  'Mazar-i-Sharif': {
    name: 'Mazar-i-Sharif',
    nameAr: 'مزار شريف',
    region: 'afghanistan',
    minLat: 36.65,
    maxLat: 36.80,
    minLng: 67.05,
    maxLng: 67.20,
  },
  // Lebanon
  'Beirut': {
    name: 'Beirut',
    nameAr: 'بيروت',
    region: 'lebanon',
    minLat: 33.85,
    maxLat: 33.95,
    minLng: 35.45,
    maxLng: 35.55,
  },
  'Tripoli': {
    name: 'Tripoli',
    nameAr: 'طرابلس',
    region: 'lebanon',
    minLat: 34.40,
    maxLat: 34.50,
    minLng: 35.80,
    maxLng: 35.90,
  },
  'South Lebanon': {
    name: 'South Lebanon',
    nameAr: 'جنوب لبنان',
    region: 'lebanon',
    minLat: 33.05,
    maxLat: 33.35,
    minLng: 35.10,
    maxLng: 35.60,
  },
  // Somalia
  'Mogadishu': {
    name: 'Mogadishu',
    nameAr: 'مقديشو',
    region: 'somalia',
    minLat: 2.00,
    maxLat: 2.10,
    minLng: 45.30,
    maxLng: 45.45,
  },
  'Kismayo': {
    name: 'Kismayo',
    nameAr: 'كيسمايو',
    region: 'somalia',
    minLat: -0.40,
    maxLat: -0.30,
    minLng: 42.50,
    maxLng: 42.60,
  },
  'Baidoa': {
    name: 'Baidoa',
    nameAr: 'بيدوة',
    region: 'somalia',
    minLat: 3.10,
    maxLat: 3.20,
    minLng: 43.60,
    maxLng: 43.70,
  },
};

export const getZoneFromCoords = (lat: number, lng: number): string => {
  for (const [, zone] of Object.entries(ZONES)) {
    if (
      lat >= zone.minLat &&
      lat <= zone.maxLat &&
      lng >= zone.minLng &&
      lng <= zone.maxLng
    ) {
      return zone.name;
    }
  }
  // Default fallback zone - center of Gaza Strip
  return 'Gaza City';
};

export const getZoneBounds = (zoneName: string) => {
  const zone = ZONES[zoneName as keyof typeof ZONES];
  if (!zone) return null;
  return {
    minLat: zone.minLat,
    maxLat: zone.maxLat,
    minLng: zone.minLng,
    maxLng: zone.maxLng,
  };
};

export const getZonesByRegion = (regionKey: string) => {
  return Object.entries(ZONES)
    .filter(([, zone]) => zone.region === regionKey)
    .map(([key, zone]) => ({ key, ...zone }));
};

export const getRegionList = () => {
  return Object.entries(REGIONS).map(([key, region]) => ({
    key,
    ...region,
  }));
};

// Get region config by key - returns center, bounds, and zoom
// Normalizes the key to lowercase for case-insensitive matching
export const getRegionConfig = (regionKey: string) => {
  const normalizedKey = regionKey?.toLowerCase().trim() || DEFAULT_REGION;
  const region = REGIONS[normalizedKey as keyof typeof REGIONS];
  if (!region) {
    console.warn(`Region '${regionKey}' not found, defaulting to Palestine`);
    // Default to Palestine if region not found
    return REGIONS['palestine'];
  }
  return region;
};

// Get the default region key (Palestine)
export const DEFAULT_REGION = 'palestine';

// Storage key constant for consistency
export const STORAGE_KEY_REGION = 'selected_region';
