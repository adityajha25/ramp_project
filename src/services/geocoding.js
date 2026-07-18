import { NYC_CENTER } from '../constants/nyc.js';
import { matchLandmarks, isExactLandmarkQuery } from '../constants/landmarks.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function mapFeature(feature) {
  const isPoi = feature.place_type?.includes('poi');
  const shortLabel =
    feature.text ||
    feature.properties?.name ||
    feature.place_name?.split(',')[0] ||
    feature.place_name;

  return {
    id: feature.id,
    label: feature.place_name,
    shortLabel,
    lat: feature.center[1],
    lng: feature.center[0],
    kind: isPoi ? 'poi' : 'address',
  };
}

/**
 * Geocode a free-text query within the NYC metro area.
 * Landmarks (JFK, Empire State, Bronx Zoo, etc.) are matched locally first.
 */
export async function geocodeAddress(query) {
  if (!query?.trim()) {
    return [];
  }

  const landmarkHits = matchLandmarks(query, { limit: 3 });

  // Exact landmark alias (jfk, empire state, bronx zoo) — prioritize local match.
  if (isExactLandmarkQuery(query) && landmarkHits.length > 0) {
    return landmarkHits;
  }

  if (!MAPBOX_TOKEN) {
    return landmarkHits.length ? landmarkHits : [];
  }

  const bbox = '-74.2591,40.4774,-73.7004,40.9176';

  // POI-first search for landmark-like queries.
  const poiUrl = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  poiUrl.searchParams.set('access_token', MAPBOX_TOKEN);
  poiUrl.searchParams.set('bbox', bbox);
  poiUrl.searchParams.set('proximity', `${NYC_CENTER.lng},${NYC_CENTER.lat}`);
  poiUrl.searchParams.set('limit', '5');
  poiUrl.searchParams.set('types', 'poi');
  poiUrl.searchParams.set('autocomplete', 'true');

  const addressUrl = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  addressUrl.searchParams.set('access_token', MAPBOX_TOKEN);
  addressUrl.searchParams.set('bbox', bbox);
  addressUrl.searchParams.set('proximity', `${NYC_CENTER.lng},${NYC_CENTER.lat}`);
  addressUrl.searchParams.set('limit', '3');
  addressUrl.searchParams.set('types', 'address,place,neighborhood,locality');
  addressUrl.searchParams.set('autocomplete', 'true');

  const [poiResponse, addressResponse] = await Promise.all([
    fetch(poiUrl),
    fetch(addressUrl),
  ]);

  if (!poiResponse.ok && !addressResponse.ok) {
    throw new Error('Unable to search locations right now.');
  }

  const poiData = poiResponse.ok ? await poiResponse.json() : { features: [] };
  const addressData = addressResponse.ok ? await addressResponse.json() : { features: [] };

  const seen = new Set();
  const merged = [];

  for (const result of [...landmarkHits, ...poiData.features.map(mapFeature), ...addressData.features.map(mapFeature)]) {
    const key = `${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(result);
  }

  return merged.slice(0, 6);
}

/**
 * Reverse geocode map clicks into readable place labels.
 */
export async function reverseGeocode({ lat, lng }) {
  if (!MAPBOX_TOKEN) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  );
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('limit', '1');
  url.searchParams.set('types', 'poi,address,place');

  const response = await fetch(url);
  if (!response.ok) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  return feature.text && feature.place_type?.includes('poi')
    ? `${feature.text}, ${feature.context?.[0]?.text ?? 'NYC'}`
    : feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
