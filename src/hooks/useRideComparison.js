import { useCallback, useMemo, useState } from 'react';
import { fetchRideQuotes, sortQuotes } from '../services/rideProviders.js';
import { isWithinNYCServiceArea } from '../constants/nyc.js';

export function useRideComparison() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [sortMode, setSortMode] = useState('cheapest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    isLoading,
    error,
  };
}
