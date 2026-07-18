/**
 * NYC service area bounds and defaults.
 * Covers NYC plus nearby NJ/CT/Westchester edges used for MVP geofencing.
 */
export const NYC_BOUNDS = {
  minLat: 40.4774,
  maxLat: 40.9176,
  minLng: -74.2591,
  maxLng: -73.7004,
};

export const NYC_CENTER = {
  lat: 40.7128,
  lng: -74.006,
};

export const DEFAULT_MAP_ZOOM = 11;

export const NYC_BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
];

/**
 * Returns true when coordinates fall inside the MVP NYC metro bounding box.
 */
export function isWithinNYCServiceArea({ lat, lng }) {
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

/**
 * Demo origin/destination pairs for quick testing in the UI.
 */
export const DEMO_ROUTES = [
  {
    id: 'times-square-jfk',
    label: 'Times Square → JFK',
    pickup: { lat: 40.758, lng: -73.9855, label: 'Times Square, Manhattan' },
    dropoff: { lat: 40.6413, lng: -73.7781, label: 'JFK Airport, Queens' },
  },
  {
    id: 'williamsburg-soho',
    label: 'Williamsburg → SoHo',
    pickup: { lat: 40.7081, lng: -73.9571, label: 'Williamsburg, Brooklyn' },
    dropoff: { lat: 40.7233, lng: -74.003, label: 'SoHo, Manhattan' },
  },
];
