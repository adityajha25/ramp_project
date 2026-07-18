import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRideQuotes,
  sortQuotes,
  estimatePersonalCarQuote,
} from '../services/rideProviders.js';
import { buildSmartItineraries } from '../services/hybridRoutes.js';
import { isWithinNYCServiceArea } from '../constants/nyc.js';
<<<<<<< Updated upstream
import { geocodeAddress } from '../services/geocoding.js';
import { parseTripIntent } from '../services/tripIntent.js';
import { getCurrentPickup } from '../services/currentLocation.js';
import { annotateArriveBy } from '../services/agentPicks.js';

async function resolvePlace(query) {
  const results = await geocodeAddress(query);
  if (!results.length) {
    throw new Error(`Could not find “${query}” in the NYC area.`);
  }
  return results[0];
}
=======
import { PERSONAL_CAR } from '../constants/providers.js';
>>>>>>> Stashed changes

export function useRideComparison() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [smartRoutes, setSmartRoutes] = useState([]);
  const [sortMode, setSortMode] = useState('cheapest');
  const [hasOwnCar, setHasOwnCar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentMeta, setAgentMeta] = useState(null);

  const sortedQuotes = useMemo(() => sortQuotes(quotes, sortMode), [quotes, sortMode]);

  const recommendedQuote = sortedQuotes[0] ?? null;

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
    async (nextPickup, nextDropoff) => {
      const providerQuotes = await fetchRideQuotes({
        pickup: nextPickup,
        dropoff: nextDropoff,
      });

      const allQuotes = hasOwnCar
        ? [...providerQuotes, estimatePersonalCarQuote(nextPickup, nextDropoff)]
        : providerQuotes;

      setQuotes(allQuotes);
      // Smart routes compare against for-hire options only — parking your own
      // car at a subway station is out of scope for the MVP.
      setSmartRoutes(
        buildSmartItineraries({
          pickup: nextPickup,
          dropoff: nextDropoff,
          directQuotes: providerQuotes,
        })
      );
    },
    [hasOwnCar]
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

<<<<<<< Updated upstream
  const loadDemoRoute = useCallback(async (route) => {
    setPickup(route.pickup);
    setDropoff(route.dropoff);
    setError(null);
    setAgentMeta(null);
    setIsLoading(true);
=======
  const loadDemoRoute = useCallback(
    async (route) => {
      setPickup(route.pickup);
      setDropoff(route.dropoff);
      setError(null);
      setIsLoading(true);
>>>>>>> Stashed changes

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

      const nextQuotes = await fetchRideQuotes({
        pickup: resolvedPickup,
        dropoff: resolvedDropoff,
      });
      const annotated = annotateArriveBy(nextQuotes, intent.arriveBy);
      setQuotes(annotated);

      setAgentMeta({
        preference,
        arriveBy: intent.arriveBy,
        source: intent.source,
        prompt: String(prompt || '').trim(),
      });

      return true;
    } catch (agentError) {
      setQuotes([]);
      setAgentMeta(null);
      setError(agentError.message || 'Unable to plan that trip right now.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    compareRoute,
    loadDemoRoute,
    runAgentTrip,
    agentMeta,
    isLoading,
    error,
    setError,
  };
}
