import { SUBWAY_FARE_USD } from '../data/subwayNetwork.js';
import { findNearestStations, routeBetweenStations } from './subwayRouter.js';
import { estimateCheapestPrivateLeg } from './rideProviders.js';
import { distanceInMiles } from '../utils/formatters.js';

/**
 * Hybrid itinerary composer (Phase 1).
 *
 * Combines subway with walking and first/last-mile rideshare legs, ranked
 * cheapest-first; savings vs the direct ride are annotated for display.
 */

const WALK_MPH = 3;
const WALK_ROUTE_FACTOR = 1.25; // straight-line to street-grid correction
const MAX_WALK_MILES = 0.55;
const RIDE_PICKUP_WAIT_MINUTES = 4;
const MIN_TRIP_MILES_FOR_TRANSIT = 0.9;

function walkMinutes(miles) {
  return Math.round((miles * WALK_ROUTE_FACTOR * 60) / WALK_MPH);
}

function buildWalkLeg(fromPoint, toPoint, fromLabel, toLabel, miles) {
  return {
    mode: 'walk',
    minutes: walkMinutes(miles),
    miles: Number((miles * WALK_ROUTE_FACTOR).toFixed(2)),
    fromLabel,
    toLabel,
    fromPoint: { lat: fromPoint.lat, lng: fromPoint.lng },
    toPoint: { lat: toPoint.lat, lng: toPoint.lng },
    costLow: 0,
    costHigh: 0,
  };
}

function buildRideLeg(fromPoint, toPoint, fromLabel, toLabel) {
  const quote = estimateCheapestPrivateLeg(fromPoint, toPoint);

  return {
    mode: 'ride',
    providerId: quote.providerId,
    providerName: quote.providerName,
    brandColor: quote.brandColor,
    minutes: quote.etaMinutes + RIDE_PICKUP_WAIT_MINUTES,
    fromLabel,
    toLabel,
    fromPoint: { lat: fromPoint.lat, lng: fromPoint.lng },
    toPoint: { lat: toPoint.lat, lng: toPoint.lng },
    costLow: quote.priceLow,
    costHigh: quote.priceHigh,
  };
}

function buildSubwayLeg(transit, fromStation, toStation) {
  return {
    mode: 'subway',
    minutes: transit.minutes,
    segments: transit.segments,
    transfers: transit.transfers,
    headwayMinutes: transit.headwayMinutes,
    fromLabel: fromStation.name,
    toLabel: toStation.name,
    fromPoint: { lat: fromStation.lat, lng: fromStation.lng },
    toPoint: { lat: toStation.lat, lng: toStation.lng },
    costLow: SUBWAY_FARE_USD,
    costHigh: SUBWAY_FARE_USD,
  };
}

function buildAccessLeg(point, pointLabel, station, direction) {
  if (station.miles <= MAX_WALK_MILES) {
    return direction === 'access'
      ? buildWalkLeg(point, station, pointLabel, station.name, station.miles)
      : buildWalkLeg(station, point, station.name, pointLabel, station.miles);
  }

  return direction === 'access'
    ? buildRideLeg(point, station, pointLabel, station.name)
    : buildRideLeg(station, point, station.name, pointLabel);
}

function summarizeItinerary(legs, departAt) {
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  const costLow = legs.reduce((sum, leg) => sum + leg.costLow, 0);
  const costHigh = legs.reduce((sum, leg) => sum + leg.costHigh, 0);
  const rideLegs = legs.filter((leg) => leg.mode === 'ride');

  const isHybrid = rideLegs.length > 0;
  const rideNames = [...new Set(rideLegs.map((leg) => leg.providerName))];

  return {
    id: legs
      .map((leg) => (leg.mode === 'subway' ? `sub:${leg.fromLabel}>${leg.toLabel}` : leg.mode))
      .join('|'),
    type: isHybrid ? 'hybrid' : 'transit',
    label: isHybrid ? `${rideNames.join(' + ')} + Subway` : 'Subway',
    legs,
    totalMinutes: Math.round(totalMinutes),
    costLow: Number(costLow.toFixed(2)),
    costHigh: Number(costHigh.toFixed(2)),
    departAt: departAt.toISOString(),
  };
}

/**
 * Build ranked smart itineraries for a trip.
 *
 * @param pickup  {lat, lng, label}
 * @param dropoff {lat, lng, label}
 * @param directQuotes quotes from fetchRideQuotes for the direct trip
 */
export function buildSmartItineraries({ pickup, dropoff, directQuotes, departAt = new Date() }) {
  const tripMiles = distanceInMiles(pickup, dropoff);
  if (tripMiles < MIN_TRIP_MILES_FOR_TRANSIT) {
    return [];
  }

  // Wide radius so far-out spots (e.g. airports) get ride-to-subway legs.
  const originStations = findNearestStations(pickup, { limit: 3, maxMiles: 4.5 });
  const destStations = findNearestStations(dropoff, { limit: 3, maxMiles: 4.5 });
  if (originStations.length === 0 || destStations.length === 0) {
    return [];
  }

  const pickupLabel = pickup.label?.split(',')[0] || 'Pickup';
  const dropoffLabel = dropoff.label?.split(',')[0] || 'Dropoff';

  const candidates = [];
  const seen = new Set();

  for (const origin of originStations) {
    for (const dest of destStations) {
      if (origin.id === dest.id) {
        continue;
      }

      const transit = routeBetweenStations(origin.id, dest.id, departAt);
      if (!transit || transit.segments.length === 0) {
        continue;
      }

      const legs = [
        buildAccessLeg(pickup, pickupLabel, origin, 'access'),
        buildSubwayLeg(transit, origin, dest),
        buildAccessLeg(dropoff, dropoffLabel, dest, 'egress'),
      ];

      const itinerary = summarizeItinerary(legs, departAt);
      if (!seen.has(itinerary.id)) {
        seen.add(itinerary.id);
        candidates.push(itinerary);
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Compare on average (midpoint) prices — matches what the UI displays.
  const averageOf = (item) => (item.priceLow ?? item.costLow) / 2 + (item.priceHigh ?? item.costHigh) / 2;

  const cheapestDirect = directQuotes.length
    ? [...directQuotes].sort((a, b) => averageOf(a) - averageOf(b))[0]
    : null;
  const fastestDirect = directQuotes.length
    ? [...directQuotes].sort((a, b) => a.etaMinutes - b.etaMinutes)[0]
    : null;

  const scored = candidates
    .map((itinerary) => {
      const savingsVsDirect = cheapestDirect
        ? Number((averageOf(cheapestDirect) - averageOf(itinerary)).toFixed(2))
        : 0;
      const minutesVsDirect = fastestDirect ? itinerary.totalMinutes - fastestDirect.etaMinutes : 0;

      return { ...itinerary, savingsVsDirect, minutesVsDirect };
    })
    .filter((itinerary) => {
      if (!fastestDirect) {
        return true;
      }

      // Sanity gate only: hide absurdly slow itineraries. Viable transit is
      // always shown, even when it doesn't beat the direct ride on price.
      const maxMinutes = Math.max(fastestDirect.etaMinutes * 4, fastestDirect.etaMinutes + 75);
      return itinerary.totalMinutes <= maxMinutes;
    });

  // Prefer cheaper-and-reasonable first; keep the list short and varied.
  scored.sort((a, b) => a.costLow - b.costLow || a.totalMinutes - b.totalMinutes);

  const results = [];
  const typeCaps = { transit: 1, hybrid: 2 };
  const seenTypes = new Map();
  for (const itinerary of scored) {
    const count = seenTypes.get(itinerary.type) ?? 0;
    if (count >= typeCaps[itinerary.type]) {
      continue;
    }
    seenTypes.set(itinerary.type, count + 1);
    results.push(itinerary);
    if (results.length >= 3) {
      break;
    }
  }

  return results;
}
