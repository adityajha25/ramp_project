export const TRIP_TIMING_MODES = {
  leaveNow: 'leaveNow',
  leaveAt: 'leaveAt',
  arriveBy: 'arriveBy',
};

export const DEFAULT_TRIP_TIMING = {
  mode: TRIP_TIMING_MODES.leaveNow,
  datetime: null,
};

/**
 * Resolve the trip's departure instant from timing preferences.
 */
export function resolveDepartureTime(timing, totalTripMinutes = 0) {
  const now = new Date();

  if (!timing || timing.mode === TRIP_TIMING_MODES.leaveNow || !timing.datetime) {
    return now;
  }

  const target = new Date(timing.datetime);

  if (timing.mode === TRIP_TIMING_MODES.leaveAt) {
    return target;
  }

  if (timing.mode === TRIP_TIMING_MODES.arriveBy) {
    return new Date(target.getTime() - totalTripMinutes * 60 * 1000);
  }

  return now;
}
