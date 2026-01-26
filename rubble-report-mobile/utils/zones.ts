export const ZONES = {
  'North Gaza': {
    name: 'North Gaza',
    minLat: 31.54,
    maxLat: 31.64,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Gaza City': {
    name: 'Gaza City',
    minLat: 31.5,
    maxLat: 31.54,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Central Gaza': {
    name: 'Central Gaza',
    minLat: 31.43,
    maxLat: 31.5,
    minLng: 34.43,
    maxLng: 34.53,
  },
  'Khan Younis': {
    name: 'Khan Younis',
    minLat: 31.34,
    maxLat: 31.43,
    minLng: 34.3,
    maxLng: 34.53,
  },
  'Rafah': {
    name: 'Rafah',
    minLat: 31.25,
    maxLat: 31.34,
    minLng: 34.23,
    maxLng: 34.53,
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
