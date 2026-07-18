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

export default function MapView({ pickup, dropoff, onPickupChange, onDropoffChange, className }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null });
  const clickModeRef = useRef('pickup');
  const routeRequestId = useRef(0);

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

  return (
    <div className={`relative overflow-hidden ${className || 'min-h-[320px] flex-1 rounded-2xl border border-gray-200 shadow-card'}`}>
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />

      <div className="glass pointer-events-none absolute left-3 top-3 rounded-xl px-3 py-2 text-xs text-gray-600">
        Click the map to set pickup, then dropoff.
      </div>
    </div>
  );
}
