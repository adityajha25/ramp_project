import { fetchDrivingRoute } from './directions.js';
import { generateDriver } from './driverPersona.js';

/**
 * Simulated ride engine for the demo.
 *
 * No provider APIs exist yet, so this fakes the full Uber-style lifecycle:
 * a driver is "assigned", drives to the pickup along real Mapbox street
 * geometry, waits, then drives the trip. Time is compressed so a 25 minute
 * ride plays out in under a minute. Multi-leg smart routes (walk + subway +
 * ride) are simulated leg by leg, spawning a fresh driver for each ride leg.
 */

const TICK_MS = 100;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineMeters(a, b) {
  const earthRadius = 6371000;
  const dLat = toRadians(b[1] - a[1]);
  const dLng = toRadians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a[1])) * Math.cos(toRadians(b[1])) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearingBetween(a, b) {
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const dLng = toRadians(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/** Precompute cumulative distances so we can interpolate smoothly. */
function buildPath(coordinates) {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineMeters(coordinates[i - 1], coordinates[i]));
  }
  return { coordinates, cumulative, total: cumulative[cumulative.length - 1] || 1 };
}

/** Position + heading at a 0..1 fraction along the path. */
function pointAlongPath(path, fraction) {
  const target = clamp(fraction, 0, 1) * path.total;
  const { coordinates, cumulative } = path;

  let i = 1;
  while (i < cumulative.length - 1 && cumulative[i] < target) {
    i += 1;
  }

  const segmentStart = cumulative[i - 1];
  const segmentLength = cumulative[i] - segmentStart || 1;
  const t = clamp((target - segmentStart) / segmentLength, 0, 1);

  const from = coordinates[i - 1];
  const to = coordinates[i];

  return {
    lng: from[0] + (to[0] - from[0]) * t,
    lat: from[1] + (to[1] - from[1]) * t,
    bearing: bearingBetween(from, to),
  };
}

/** Spawn the driver on a random block ~0.4–0.9 miles from the pickup. */
function randomSpawnNear(point) {
  const meters = 650 + Math.random() * 800;
  const angle = Math.random() * Math.PI * 2;
  const dLat = (meters * Math.cos(angle)) / 111320;
  const dLng = (meters * Math.sin(angle)) / (111320 * Math.cos(toRadians(point.lat)));
  return { lat: point.lat + dLat, lng: point.lng + dLng };
}

function wait(ms, isCancelled) {
  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      if (isCancelled()) {
        window.clearInterval(timer);
        resolve();
      }
    }, 120);
    window.setTimeout(() => {
      window.clearInterval(timer);
      resolve();
    }, ms);
  });
}

/**
 * Animate along a path over `durationMs`, emitting position ticks.
 * `realMinutes` is the pretend duration shown as the countdown ETA.
 */
function animatePath({ path, durationMs, realMinutes, isCancelled, onTick }) {
  return new Promise((resolve) => {
    const startedAt = performance.now();

    const timer = window.setInterval(() => {
      if (isCancelled()) {
        window.clearInterval(timer);
        resolve();
        return;
      }

      const fraction = clamp((performance.now() - startedAt) / durationMs, 0, 1);
      const position = pointAlongPath(path, fraction);
      onTick({
        position,
        progress: fraction,
        remainingMinutes: Math.max(Math.ceil(realMinutes * (1 - fraction)), fraction >= 1 ? 0 : 1),
      });

      if (fraction >= 1) {
        window.clearInterval(timer);
        resolve();
      }
    }, TICK_MS);
  });
}

async function drivingPath(from, to) {
  const coordinates = await fetchDrivingRoute(from, to);
  return buildPath(coordinates);
}

function straightPath(from, to) {
  return buildPath([
    [from.lng, from.lat],
    [to.lng, to.lat],
  ]);
}

/**
 * Simulate one for-hire ride: assign driver, drive to pickup, wait, drive trip.
 * Emits phases: assigning → toPickup → arrivedAtPickup → inTrip.
 */
async function simulateRideSegment({
  providerId,
  providerName,
  brandColor,
  pickup,
  dropoff,
  tripMinutes,
  emit,
  isCancelled,
  legContext,
}) {
  const base = { mode: 'ride', providerId, providerName, brandColor, ...legContext };

  emit({ ...base, phase: 'assigning', driver: null, position: null });
  await wait(1600 + Math.random() * 1200, isCancelled);
  if (isCancelled()) return;

  const driver = generateDriver(providerId);
  const arrivalMinutes = clamp(Math.round(tripMinutes / 4) + 1, 2, 7);

  const spawn = randomSpawnNear(pickup);
  const approachPath = await drivingPath(spawn, pickup);
  if (isCancelled()) return;

  await animatePath({
    path: approachPath,
    durationMs: clamp(arrivalMinutes * 3200, 8000, 16000),
    realMinutes: arrivalMinutes,
    isCancelled,
    onTick: (tick) => emit({ ...base, phase: 'toPickup', driver, ...tick }),
  });
  if (isCancelled()) return;

  emit({
    ...base,
    phase: 'arrivedAtPickup',
    driver,
    position: { lat: pickup.lat, lng: pickup.lng, bearing: 0 },
    remainingMinutes: 0,
  });
  await wait(2800, isCancelled);
  if (isCancelled()) return;

  const tripPath = await drivingPath(pickup, dropoff);
  if (isCancelled()) return;

  await animatePath({
    path: tripPath,
    durationMs: clamp(tripMinutes * 1300, 16000, 40000),
    realMinutes: tripMinutes,
    isCancelled,
    onTick: (tick) => emit({ ...base, phase: 'inTrip', driver, ...tick }),
  });
}

/** Simulate a walk or subway leg along its geometry. */
async function simulateTransitSegment({ leg, emit, isCancelled, legContext }) {
  const base = { mode: leg.mode, ...legContext };
  const path = straightPath(leg.fromPoint, leg.toPoint);

  const durationMs =
    leg.mode === 'walk'
      ? clamp(leg.minutes * 900, 5000, 11000)
      : clamp(leg.minutes * 800, 9000, 18000);

  await animatePath({
    path,
    durationMs,
    realMinutes: leg.minutes,
    isCancelled,
    onTick: (tick) => emit({ ...base, phase: leg.mode === 'walk' ? 'walking' : 'onTransit', ...tick }),
  });
}

/**
 * Simulate a direct ride booking (single provider quote).
 * Returns a controller with cancel().
 */
export function startRideSimulation({ pickup, dropoff, quote, onUpdate }) {
  let cancelled = false;
  const isCancelled = () => cancelled;
  const emit = (update) => {
    if (!cancelled) {
      onUpdate(update);
    }
  };

  (async () => {
    await simulateRideSegment({
      providerId: quote.providerId,
      providerName: quote.providerName,
      brandColor: quote.brandColor,
      pickup,
      dropoff,
      tripMinutes: quote.etaMinutes,
      emit,
      isCancelled,
      legContext: {
        legIndex: 0,
        legCount: 1,
        fromLabel: pickup.label,
        toLabel: dropoff.label,
      },
    });

    if (!cancelled) {
      emit({
        mode: 'ride',
        phase: 'completed',
        legIndex: 0,
        legCount: 1,
        toLabel: dropoff.label,
        position: { lat: dropoff.lat, lng: dropoff.lng, bearing: 0 },
      });
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}

/**
 * Simulate a mixed-transport smart route: walks and subway legs play through,
 * and every ride leg spawns its own simulated driver.
 */
export function startItinerarySimulation({ itinerary, onUpdate }) {
  let cancelled = false;
  const isCancelled = () => cancelled;
  const emit = (update) => {
    if (!cancelled) {
      onUpdate(update);
    }
  };

  (async () => {
    const legCount = itinerary.legs.length;

    for (let index = 0; index < legCount; index += 1) {
      if (cancelled) return;

      const leg = itinerary.legs[index];
      const legContext = {
        legIndex: index,
        legCount,
        fromLabel: leg.fromLabel,
        toLabel: leg.toLabel,
        leg,
      };

      if (leg.mode === 'ride') {
        await simulateRideSegment({
          providerId: leg.providerId,
          providerName: leg.providerName,
          brandColor: leg.brandColor,
          pickup: { ...leg.fromPoint, label: leg.fromLabel },
          dropoff: { ...leg.toPoint, label: leg.toLabel },
          tripMinutes: Math.max(leg.minutes - 4, 3),
          emit,
          isCancelled,
          legContext,
        });
      } else {
        await simulateTransitSegment({ leg, emit, isCancelled, legContext });
      }
    }

    if (!cancelled) {
      const lastLeg = itinerary.legs[legCount - 1];
      emit({
        mode: 'ride',
        phase: 'completed',
        legIndex: legCount - 1,
        legCount,
        toLabel: lastLeg.toLabel,
        position: { lat: lastLeg.toPoint.lat, lng: lastLeg.toPoint.lng, bearing: 0 },
      });
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
