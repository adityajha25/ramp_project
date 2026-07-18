import { useCallback, useMemo, useState } from 'react';
import { fetchRideQuotes, sortQuotes } from '../services/rideProviders.js';
import { isWithinNYCServiceArea } from '../constants/nyc.js';
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

export function useRideComparison() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [sortMode, setSortMode] = useState('cheapest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentMeta, setAgentMeta] = useState(null);

  const sortedQuotes = useMemo(() => sortQuotes(quotes, sortMode), [quotes, sortMode]);

  const recommendedQuote = sortedQuotes[0] ?? null;

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
      const nextQuotes = await fetchRideQuotes({ pickup, dropoff });
      setQuotes(nextQuotes);
      return true;
    } catch (compareError) {
      setQuotes([]);
      setError(compareError.message || 'Unable to compare rides right now.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [pickup, dropoff]);

  const loadDemoRoute = useCallback(async (route) => {
    setPickup(route.pickup);
    setDropoff(route.dropoff);
    setError(null);
    setAgentMeta(null);
    setIsLoading(true);

    try {
      const nextQuotes = await fetchRideQuotes(route);
      setQuotes(nextQuotes);
      return true;
    } catch (compareError) {
      setQuotes([]);
      setError(compareError.message || 'Unable to compare rides right now.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    recommendedQuote,
    sortMode,
    setSortMode,
    compareRoute,
    loadDemoRoute,
    runAgentTrip,
    agentMeta,
    isLoading,
    error,
    setError,
  };
}
