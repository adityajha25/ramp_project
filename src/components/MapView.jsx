import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { NYC_CENTER, DEFAULT_MAP_ZOOM } from '../constants/nyc.js';
import { reverseGeocode } from '../services/geocoding.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ pickup, dropoff, onPickupChange, onDropoffChange }) {
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
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [NYC_CENTER.lng, NYC_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

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

    renderMarker('pickup', pickup, '#22c55e');
    renderMarker('dropoff', dropoff, '#ef4444');

    if (pickup && dropoff) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickup.lng, pickup.lat]);
      bounds.extend([dropoff.lng, dropoff.lat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 13 });
    } else if (pickup) {
      map.flyTo({ center: [pickup.lng, pickup.lat], zoom: 13 });
    } else if (dropoff) {
      map.flyTo({ center: [dropoff.lng, dropoff.lat], zoom: 13 });
    }
  }, [pickup, dropoff]);

  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />

      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 backdrop-blur">
        Click the map to set pickup, then dropoff.
      </div>
    </div>
  );
}
