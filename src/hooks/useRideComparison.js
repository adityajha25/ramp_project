import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRideQuotes,
  sortQuotes,
  estimatePersonalCarQuote,
} from '../services/rideProviders.js';
import { buildSmartItineraries } from '../services/hybridRoutes.js';
import { isWithinNYCServiceArea } from '../constants/nyc.js';
import { PERSONAL_CAR } from '../constants/providers.js';
import { geocodeAddress } from '../services/geocoding.js';
import { parseTripIntent } from '../services/tripIntent.js';
import { getCurrentPickup } from '../services/currentLocation.js';
import { annotateArriveBy } from '../services/agentPicks.js';
import {
  DEFAULT_TRIP_TIMING,
  resolveDepartureTime,
  TRIP_TIMING_MODES,
} from '../constants/tripTiming.js';

async function resolvePlace(query) {
  const results = await geocodeAddress(query);
  if (!results.length) {
    throw new Error(`Could not find “${query}” in the NYC area.`);
  }
  return results[0];
}

export function useRideComparison() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [smartRoutes, setSmartRoutes] = useState([]);
  const [sortMode, setSortMode] = useState('cheapest');
  const [hasOwnCar, setHasOwnCar] = useState(false);
  const [tripTiming, setTripTiming] = useState(DEFAULT_TRIP_TIMING);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentMeta, setAgentMeta] = useState(null);

  const sortedQuotes = useMemo(() => sortQuotes(quotes, sortMode), [quotes, sortMode]);

  const recommendedQuote = sortedQuotes[0] ?? null;

  const departAt = useMemo(
    () => resolveDepartureTime(tripTiming, recommendedQuote?.etaMinutes ?? 0),
    [tripTiming, recommendedQuote?.etaMinutes]
  );

  // Rebuild smart routes when trip timing changes (headways + step schedules).
  useEffect(() => {
    if (!pickup || !dropoff) {
      return;
    }

    const providerQuotes = quotes.filter((quote) => quote.providerId !== PERSONAL_CAR.id);
    if (providerQuotes.length === 0) {
      return;
    }

    setSmartRoutes(
      buildSmartItineraries({
        pickup,
        dropoff,
        directQuotes: providerQuotes,
        departAt,
      })
    );
  }, [pickup, dropoff, departAt, quotes]);

  // Keep the personal car quote in sync when the toggle flips after a compare.
  useEffect(() => {
    if (!pickup || !dropoff) {
      return;
    }

    setQuotes((prev) => {
      const withoutCar = prev.filter((quote) => quote.providerId !== PERSONAL_CAR.id);
      if (!hasOwnCar || withoutCar.length === 0) {
        return withoutCar;
      }
      return [...withoutCar, estimatePersonalCarQuote(pickup, dropoff)];
    });
  }, [hasOwnCar, pickup, dropoff]);

  const runComparison = useCallback(
    async (nextPickup, nextDropoff, timingOverride) => {
      const timing = timingOverride ?? tripTiming;
      const providerQuotes = await fetchRideQuotes({
        pickup: nextPickup,
        dropoff: nextDropoff,
      });
      const departure = resolveDepartureTime(timing, providerQuotes[0]?.etaMinutes ?? 0);

      const allQuotes = hasOwnCar
        ? [...providerQuotes, estimatePersonalCarQuote(nextPickup, nextDropoff)]
        : providerQuotes;

      let finalQuotes = allQuotes;

      if (timing.mode === TRIP_TIMING_MODES.arriveBy && timing.datetime) {
        finalQuotes = annotateArriveBy(allQuotes, timing.datetime);
      }

      setQuotes(finalQuotes);
      // Smart routes also refresh via departAt effect; set here for immediate compare results.
      setSmartRoutes(
        buildSmartItineraries({
          pickup: nextPickup,
          dropoff: nextDropoff,
          directQuotes: providerQuotes,
          departAt: departure,
        })
      );
    },
    [hasOwnCar, tripTiming]
  );

  const compareRoute = useCallback(async () => {
    if (!pickup || !dropoff) {
      setError('Choose both a pickup and dropoff location.');
      return false;
    }

    if (!isWithinNYCServiceArea(pickup) || !isWithinNYCServiceArea(dropoff)) {
      setError('OneRide MVP is limited to NYC and surrounding areas.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setAgentMeta(null);

    try {
      await runComparison(pickup, dropoff);
      return true;
    } catch (compareError) {
      setQuotes([]);
      setSmartRoutes([]);
      setError(compareError.message || 'Unable to compare rides right now.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [pickup, dropoff, runComparison]);

  const loadDemoRoute = useCallback(
    async (route) => {
      setPickup(route.pickup);
      setDropoff(route.dropoff);
      setError(null);
      setAgentMeta(null);
      setIsLoading(true);

      try {
        await runComparison(route.pickup, route.dropoff);
        return true;
      } catch (compareError) {
        setQuotes([]);
        setSmartRoutes([]);
        setError(compareError.message || 'Unable to compare rides right now.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [runComparison]
  );

  const runAgentTrip = useCallback(async (prompt) => {
    setIsLoading(true);
    setError(null);
    setAgentMeta(null);

    try {
      const intent = await parseTripIntent(prompt);

      const resolvedDropoff = await resolvePlace(intent.dropoffQuery);
      const resolvedPickup = intent.pickupQuery
        ? await resolvePlace(intent.pickupQuery)
        : await getCurrentPickup();

      if (!isWithinNYCServiceArea(resolvedPickup) || !isWithinNYCServiceArea(resolvedDropoff)) {
        throw new Error('OneRide MVP is limited to NYC and surrounding areas.');
      }

      const preference = intent.preference || 'bestValue';

      setPickup(resolvedPickup);
      setDropoff(resolvedDropoff);
      setSortMode(preference);

      if (intent.arriveBy) {
        setTripTiming({ mode: TRIP_TIMING_MODES.arriveBy, datetime: intent.arriveBy });
      }

      const providerQuotes = await fetchRideQuotes({
        pickup: resolvedPickup,
        dropoff: resolvedDropoff,
      });

      const allQuotes = hasOwnCar
        ? [...providerQuotes, estimatePersonalCarQuote(resolvedPickup, resolvedDropoff)]
        : providerQuotes;

      const annotated = annotateArriveBy(allQuotes, intent.arriveBy);
      setQuotes(annotated);
      setSmartRoutes(
        buildSmartItineraries({
          pickup: resolvedPickup,
          dropoff: resolvedDropoff,
          directQuotes: providerQuotes,
          departAt: resolveDepartureTime(
            intent.arriveBy
              ? { mode: TRIP_TIMING_MODES.arriveBy, datetime: intent.arriveBy }
              : tripTiming,
            annotated[0]?.etaMinutes ?? 0
          ),
        })
      );

      setAgentMeta({
        preference,
        arriveBy: intent.arriveBy,
        source: intent.source,
        prompt: String(prompt || '').trim(),
      });

      return true;
    } catch (agentError) {
      setQuotes([]);
      setSmartRoutes([]);
      setAgentMeta(null);
      setError(agentError.message || 'Unable to plan that trip right now.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasOwnCar, tripTiming]);

  return {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    quotes: sortedQuotes,
    smartRoutes,
    recommendedQuote,
    sortMode,
    setSortMode,
    hasOwnCar,
    setHasOwnCar,
    tripTiming,
    setTripTiming,
    departAt,
    compareRoute,
    loadDemoRoute,
    runAgentTrip,
    agentMeta,
    isLoading,
    error,
    setError,
  };
}
