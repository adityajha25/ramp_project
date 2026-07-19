import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { NYC_CENTER, DEFAULT_MAP_ZOOM } from '../constants/nyc.js';
import { reverseGeocode } from '../services/geocoding.js';
import { useTheme } from '../context/ThemeContext.jsx';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ROUTE_SOURCE_ID = 'trip-route';
const EMPTY_ROUTE = { type: 'FeatureCollection', features: [] };
const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/navigation-night-v1',
};

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
function ensureColoredRouteLayers(map, isDark) {
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
    paint: {
      'line-color': isDark ? '#F6F2E9' : '#ffffff',
      'line-width': 9,
      'line-opacity': isDark ? 0.18 : 0.85,
    },
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

function setRouteData(map, geoJson, isDark) {
  removeLegacyRouteLayers(map);
  ensureColoredRouteLayers(map, isDark);
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

function vehicleMarkerElement(mode, color) {
  const element = document.createElement('div');

  if (mode === 'ride') {
    element.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(15,23,42,0.35));">
        <g>
          <rect x="7" y="3" width="10" height="18" rx="3.2" fill="${color || '#0f172a'}" stroke="#ffffff" stroke-width="1.4"/>
          <rect x="8.4" y="6" width="7.2" height="3.4" rx="1.2" fill="rgba(255,255,255,0.85)"/>
          <rect x="8.4" y="15" width="7.2" height="2.6" rx="1" fill="rgba(255,255,255,0.55)"/>
        </g>
      </svg>`;
  } else {
    // Bright dots so the rider stays visible on the dark navigation map.
    const dotColor = mode === 'walk' ? '#2FE6A8' : '#F6F2E9';
    element.innerHTML = `
      <span style="position:relative;display:block;width:18px;height:18px;">
        <span style="position:absolute;inset:-6px;border-radius:9999px;background:${dotColor};opacity:0.3;animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:${dotColor};border:3px solid #141826;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></span>
      </span>`;
  }

  return element;
}

export default function MapView({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  routeGeoJson,
  vehicle,
  className,
}) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null });
  const clickModeRef = useRef('pickup');
  const vehicleMarkerRef = useRef(null);
  const vehicleKindRef = useRef(null);
  const lastFollowRef = useRef(0);
  const mapThemeRef = useRef(isDark);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[isDark ? 'dark' : 'light'],
      center: [NYC_CENTER.lng, NYC_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('load', () => {
      ensureColoredRouteLayers(map, isDark);
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
    mapThemeRef.current = isDark;

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
      setRouteData(map, routeGeoJson, isDark);
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
  }, [routeGeoJson, pickup, dropoff, isDark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapThemeRef.current === isDark) {
      return undefined;
    }

    mapThemeRef.current = isDark;
    const style = MAP_STYLES[isDark ? 'dark' : 'light'];

    const apply = () => {
      setRouteData(map, routeGeoJson, isDark);
    };

    map.setStyle(style);
    map.once('style.load', apply);

    return () => {
      map.off('style.load', apply);
    };
  }, [isDark, routeGeoJson]);

  // Simulated vehicle marker: animated car (or walking/subway dot) that
  // follows the trip. Recreated when the transport mode changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!vehicle?.position) {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
        vehicleKindRef.current = null;
      }
      return;
    }

    const kind = `${vehicle.mode}-${vehicle.color || ''}`;

    if (vehicleMarkerRef.current && vehicleKindRef.current !== kind) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = new mapboxgl.Marker({
        element: vehicleMarkerElement(vehicle.mode, vehicle.color),
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat([vehicle.position.lng, vehicle.position.lat])
        .addTo(map);
      vehicleKindRef.current = kind;
    }

    vehicleMarkerRef.current.setLngLat([vehicle.position.lng, vehicle.position.lat]);
    if (vehicle.mode === 'ride') {
      vehicleMarkerRef.current.setRotation(vehicle.position.bearing ?? 0);
    }

    // Gently keep the camera on the vehicle without fighting user drags.
    const now = performance.now();
    if (now - lastFollowRef.current > 1500) {
      lastFollowRef.current = now;
      map.easeTo({
        center: [vehicle.position.lng, vehicle.position.lat],
        duration: 900,
        zoom: Math.max(map.getZoom(), 13.5),
      });
    }
  }, [vehicle]);

  return (
    <div className={`relative overflow-hidden ${className || 'min-h-[320px] flex-1 rounded-2xl border border-surface-hair shadow-card'}`}>
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />

      <div className="glass pointer-events-none absolute left-3 top-3 rounded-xl px-3 py-2 font-mono text-[11px] text-paper-dim">
        Click the map to set pickup, then dropoff.
      </div>
    </div>
  );
}
