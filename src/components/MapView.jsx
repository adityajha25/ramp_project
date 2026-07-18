import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { NYC_CENTER, DEFAULT_MAP_ZOOM } from '../constants/nyc.js';
import { reverseGeocode } from '../services/geocoding.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ROUTE_SOURCE_ID = 'trip-route';
const EMPTY_ROUTE = { type: 'FeatureCollection', features: [] };

function removeLegacyRouteLayers(map) {
  ['trip-route-line', 'trip-route-casing', 'trip-route-solid', 'trip-route-dashed'].forEach((id) => {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  });
  if (map.getSource(ROUTE_SOURCE_ID)) {
    map.removeSource(ROUTE_SOURCE_ID);
  }
}

/** Multi-color route layers: solid lines use feature `color`, walks use dashed gray. */
function ensureColoredRouteLayers(map) {
  if (map.getSource(ROUTE_SOURCE_ID)) {
    return;
  }

  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: EMPTY_ROUTE,
  });

  map.addLayer({
    id: 'trip-route-casing',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['!=', ['get', 'dashed'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#F6F2E9', 'line-width': 9, 'line-opacity': 0.18 },
  });

  map.addLayer({
    id: 'trip-route-solid',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['!=', ['get', 'dashed'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#5B8CFF'],
      'line-width': 4.5,
      'line-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'trip-route-dashed',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['==', ['get', 'dashed'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#6b7280'],
      'line-width': 3,
      'line-dasharray': [0.2, 2],
    },
  });
}

function setRouteData(map, geoJson) {
  removeLegacyRouteLayers(map);
  ensureColoredRouteLayers(map);
  map.getSource(ROUTE_SOURCE_ID).setData(geoJson ?? EMPTY_ROUTE);
}

function fitRouteBounds(map, geoJson, pickup, dropoff) {
  const bounds = new mapboxgl.LngLatBounds();

  if (geoJson?.features?.length) {
    for (const feature of geoJson.features) {
      for (const coordinate of feature.geometry.coordinates) {
        bounds.extend(coordinate);
      }
    }
  } else {
    if (pickup) {
      bounds.extend([pickup.lng, pickup.lat]);
    }
    if (dropoff) {
      bounds.extend([dropoff.lng, dropoff.lat]);
    }
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 70, maxZoom: 14 });
  }
}

export default function MapView({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  routeGeoJson,
  className,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null });
  const clickModeRef = useRef('pickup');

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [NYC_CENTER.lng, NYC_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('load', () => {
      ensureColoredRouteLayers(map);
    });

    map.on('click', async (event) => {
      const point = {
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      };

      const label = await reverseGeocode(point);
      const location = { ...point, label };

      if (clickModeRef.current === 'pickup') {
        onPickupChange(location);
        clickModeRef.current = 'dropoff';
      } else {
        onDropoffChange(location);
        clickModeRef.current = 'pickup';
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onPickupChange, onDropoffChange]);

  // Pickup / dropoff markers and bounds only — route colors come from routeGeoJson.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const renderMarker = (type, location, color) => {
      if (!location) {
        if (markersRef.current[type]) {
          markersRef.current[type].remove();
          markersRef.current[type] = null;
        }
        return;
      }

      if (markersRef.current[type]) {
        markersRef.current[type].setLngLat([location.lng, location.lat]);
        return;
      }

      markersRef.current[type] = new mapboxgl.Marker({ color })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
    };

    renderMarker('pickup', pickup, '#2FE6A8');
    renderMarker('dropoff', dropoff, '#5B8CFF');

    if (pickup && !dropoff) {
      map.flyTo({ center: [pickup.lng, pickup.lat], zoom: 13 });
    } else if (dropoff && !pickup) {
      map.flyTo({ center: [dropoff.lng, dropoff.lat], zoom: 13 });
    }

    return undefined;
  }, [pickup, dropoff]);

  // Draw selected route with per-leg colors (rideshare brand, MTA line, dashed walk).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const apply = () => {
      setRouteData(map, routeGeoJson);
      fitRouteBounds(map, routeGeoJson, pickup, dropoff);
    };

    if (map.isStyleLoaded()) {
      apply();
      return undefined;
    }

    map.once('load', apply);
    return () => {
      map.off('load', apply);
    };
  }, [routeGeoJson, pickup, dropoff]);

  return (
    <div className={`relative overflow-hidden ${className || 'min-h-[320px] flex-1 rounded-2xl border border-surface-hair shadow-card'}`}>
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />

      <div className="glass pointer-events-none absolute left-3 top-3 rounded-xl px-3 py-2 font-mono text-[11px] text-paper-dim">
        Click the map to set pickup, then dropoff.
      </div>
    </div>
  );
}
