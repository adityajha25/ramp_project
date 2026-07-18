import { NYC_CENTER } from '../constants/nyc.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Geocode a free-text address within the NYC metro area using Mapbox.
 */
export async function geocodeAddress(query) {
  if (!query?.trim()) {
    return [];
  }

  if (!MAPBOX_TOKEN) {
    throw new Error('Missing VITE_MAPBOX_TOKEN. Copy .env.example to .env.');
  }

  const bbox = '-74.2591,40.4774,-73.7004,40.9176';
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );

  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('proximity', `${NYC_CENTER.lng},${NYC_CENTER.lat}`);
  url.searchParams.set('limit', '5');
  url.searchParams.set('types', 'address,poi,place,neighborhood,locality');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to search locations right now.');
  }

  const data = await response.json();

  return (data.features || []).map((feature) => ({
    id: feature.id,
    label: feature.place_name,
    lat: feature.center[1],
    lng: feature.center[0],
  }));
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

  const response = await fetch(url);
  if (!response.ok) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  const data = await response.json();
  return data.features?.[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
