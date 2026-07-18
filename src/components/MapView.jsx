import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { NYC_CENTER, DEFAULT_MAP_ZOOM } from '../constants/nyc.js';
import { reverseGeocode } from '../services/geocoding.js';
import { fetchDrivingRoute } from '../services/directions.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ROUTE_SOURCE = 'trip-route';
const ROUTE_LAYER = 'trip-route-line';

function ensureRouteLayer(map) {
  if (map.getSource(ROUTE_SOURCE)) {
    return;
  }

  map.addSource(ROUTE_SOURCE, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] },
      properties: {},
    },
  });

  map.addLayer({
    id: ROUTE_LAYER,
    type: 'line',
    source: ROUTE_SOURCE,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#2563eb',
      'line-width': 4,
      'line-opacity': 0.85,
    },
  });
}

function setRouteCoordinates(map, coordinates) {
  const source = map.getSource(ROUTE_SOURCE);
  if (!source) {
    return;
  }

  source.setData({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates || [],
    },
    properties: {},
  });
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
    const dotColor = mode === 'walk' ? '#2ec4a0' : '#1f2937';
    element.innerHTML = `
      <span style="position:relative;display:block;width:18px;height:18px;">
        <span style="position:absolute;inset:-6px;border-radius:9999px;background:${dotColor};opacity:0.25;animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:${dotColor};border:3px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.35);"></span>
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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null });
  const clickModeRef = useRef('pickup');
  const routeRequestId = useRef(0);
  const vehicleMarkerRef = useRef(null);
  const vehicleKindRef = useRef(null);
  const lastFollowRef = useRef(0);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [NYC_CENTER.lng, NYC_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('load', () => {
      ensureRouteLayer(map);
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

    renderMarker('pickup', pickup, '#2ec4a0');
    renderMarker('dropoff', dropoff, '#2563eb');

    const requestId = ++routeRequestId.current;

    const updateRoute = async () => {
      if (!pickup || !dropoff) {
        if (map.isStyleLoaded()) {
          ensureRouteLayer(map);
          setRouteCoordinates(map, []);
        }
        return;
      }

      const coordinates = await fetchDrivingRoute(pickup, dropoff);
      if (requestId !== routeRequestId.current || !mapRef.current) {
        return;
      }

      const apply = () => {
        ensureRouteLayer(map);
        setRouteCoordinates(map, coordinates);
      };

      if (map.isStyleLoaded()) {
        apply();
      } else {
        map.once('load', apply);
      }

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickup.lng, pickup.lat]);
      bounds.extend([dropoff.lng, dropoff.lat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 13 });
    };

    updateRoute();

    if (pickup && !dropoff) {
      map.flyTo({ center: [pickup.lng, pickup.lat], zoom: 13 });
    } else if (dropoff && !pickup) {
      map.flyTo({ center: [dropoff.lng, dropoff.lat], zoom: 13 });
    }

    return undefined;
  }, [pickup, dropoff]);

  // Draw the selected route (direct ride or multi-leg smart itinerary).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const emptyCollection = { type: 'FeatureCollection', features: [] };

    const apply = () => {
      const data = routeGeoJson ?? emptyCollection;
      const source = map.getSource('trip-route');

      if (source) {
        source.setData(data);
      } else {
        map.addSource('trip-route', { type: 'geojson', data });
        map.addLayer({
          id: 'trip-route-casing',
          type: 'line',
          source: 'trip-route',
          filter: ['!=', ['get', 'dashed'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
        });
        map.addLayer({
          id: 'trip-route-solid',
          type: 'line',
          source: 'trip-route',
          filter: ['!=', ['get', 'dashed'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': ['get', 'color'], 'line-width': 4.5, 'line-opacity': 0.95 },
        });
        map.addLayer({
          id: 'trip-route-dashed',
          type: 'line',
          source: 'trip-route',
          filter: ['==', ['get', 'dashed'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 3,
            'line-dasharray': [0.2, 2],
          },
        });
      }

      if (routeGeoJson?.features?.length) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const feature of routeGeoJson.features) {
          for (const coordinate of feature.geometry.coordinates) {
            bounds.extend(coordinate);
          }
        }
        map.fitBounds(bounds, { padding: 70, maxZoom: 14 });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
      return undefined;
    }

    map.once('load', apply);
    return () => {
      map.off('load', apply);
    };
  }, [routeGeoJson]);

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
    <div className={`relative overflow-hidden ${className || 'min-h-[320px] flex-1 rounded-2xl border border-gray-200 shadow-card'}`}>
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />

      <div className="glass pointer-events-none absolute left-3 top-3 rounded-xl px-3 py-2 text-xs text-gray-600">
        Click the map to set pickup, then dropoff.
      </div>
    </div>
  );
}
