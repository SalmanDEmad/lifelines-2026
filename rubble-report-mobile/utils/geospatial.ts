/**
 * Geospatial utility functions for coordinate validation
 */

// Gaza Strip actual boundaries (approximate polygon coordinates in counterclockwise order)
// North Gaza, Gaza City, Central Gaza, Khan Younis, Rafah areas
const GAZA_POLYGON = [
  { lat: 31.5438, lng: 34.2345 }, // Northwest corner (near Beit Lahia)
  { lat: 31.5425, lng: 34.5207 }, // Northeast corner
  { lat: 31.2272, lng: 34.5233 }, // Southeast corner (near Rafah)
  { lat: 31.2177, lng: 34.2346 }, // Southwest corner (Philadelphi Corridor area)
  { lat: 31.5438, lng: 34.2345 }, // Close polygon
];

// Israel boundaries (approximate)
const ISRAEL_POLYGON = [
  { lat: 33.3, lng: 34.2 },
  { lat: 33.3, lng: 35.9 },
  { lat: 31.0, lng: 35.9 },
  { lat: 31.0, lng: 34.2 },
  { lat: 33.3, lng: 34.2 },
];

/**
 * Point-in-polygon test using ray casting algorithm
 * Returns true if point is inside polygon
 */
export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean => {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Check if a coordinate is in Gaza
 */
export const isInGaza = (lat: number, lng: number): boolean => {
  return isPointInPolygon({ lat, lng }, GAZA_POLYGON);
};

/**
 * Check if a coordinate is in Israel
 */
export const isInIsrael = (lat: number, lng: number): boolean => {
  return isPointInPolygon({ lat, lng }, ISRAEL_POLYGON);
};

/**
 * Check if a coordinate is in the greater Gaza/Palestine region
 * (includes some buffer area)
 */
export const isInPalestineRegion = (lat: number, lng: number): boolean => {
  // Palestine region bounds with buffer
  return lat >= 30.8 && lat <= 31.6 && lng >= 34.0 && lng <= 35.8;
};
