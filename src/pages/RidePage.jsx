import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import RideComparison from '../components/RideComparison.jsx';
import SmartRoutes from '../components/SmartRoutes.jsx';
import BookingSheet from '../components/BookingSheet.jsx';
import TripTimingSelector from '../components/TripTimingSelector.jsx';
import { SORT_MODES, PERSONAL_CAR } from '../constants/providers.js';
import { formatAveragePrice } from '../utils/formatters.js';
import { buildDirectRideGeoJson, buildItineraryGeoJson } from '../services/routeGeometry.js';

function TripSummary({ pickup, dropoff }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="my-1 w-px flex-1 bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Pickup</p>
            <p className="truncate text-sm font-medium text-ink">{pickup?.label || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Dropoff</p>
            <p className="truncate text-sm font-medium text-ink">{dropoff?.label || '—'}</p>
          </div>
        </div>
        <Link
          to="/"
          className="self-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-brand hover:text-brand"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

export default function RidePage({ ride }) {
  const navigate = useNavigate();
  const {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    quotes,
    smartRoutes,
    recommendedQuote,
    sortMode,
    setSortMode,
    hasOwnCar,
    setHasOwnCar,
    compareRoute,
    tripTiming,
    setTripTiming,
    agentMeta,
    isLoading,
    error,
  } = ride;

  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedTiers, setSelectedTiers] = useState({});
  const [mapFocus, setMapFocus] = useState(null);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const bookingTimerRef = useRef(null);

  const selectedQuote =
    quotes.find((quote) => quote.providerId === selectedProviderId) ?? recommendedQuote;

  const activeTier =
    selectedQuote?.tiers?.find((tier) => tier.id === selectedTiers[selectedQuote.providerId]) ??
    selectedQuote?.tiers?.[0] ??
    null;

  const bookingQuote =
    selectedQuote && activeTier
      ? {
          ...selectedQuote,
          providerName: activeTier.name,
          priceLow: activeTier.priceLow,
          priceHigh: activeTier.priceHigh,
          etaMinutes: activeTier.etaMinutes ?? selectedQuote.etaMinutes,
        }
      : selectedQuote;

  const isOwnCarSelected = selectedQuote?.providerId === PERSONAL_CAR.id;

  // No trip set (e.g. direct URL visit) — send the user back to the home page.
  useEffect(() => {
    if (!pickup || !dropoff) {
      navigate('/', { replace: true });
    }
  }, [pickup, dropoff, navigate]);

  useEffect(() => () => window.clearTimeout(bookingTimerRef.current), []);

  // Default the map to the recommended provider's route.
  useEffect(() => {
    if (!mapFocus && recommendedQuote) {
      setMapFocus({ type: 'provider', id: recommendedQuote.providerId });
    }
  }, [mapFocus, recommendedQuote]);

  // Build color-coded geometry for whatever is focused on the map.
  useEffect(() => {
    if (!mapFocus || !pickup || !dropoff) {
      setRouteGeoJson(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      let geoJson = null;

      if (mapFocus.type === 'provider') {
        const quote = quotes.find((item) => item.providerId === mapFocus.id);
        geoJson = await buildDirectRideGeoJson(pickup, dropoff, quote?.brandColor ?? '#0f172a');
      } else {
        const itinerary = smartRoutes.find((item) => item.id === mapFocus.id);
        if (itinerary) {
          geoJson = await buildItineraryGeoJson(itinerary);
        }
      }

      if (!cancelled) {
        setRouteGeoJson(geoJson);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapFocus, pickup, dropoff, quotes, smartRoutes]);

  if (!pickup || !dropoff) {
    return null;
  }

  const handleSelectQuote = (providerId) => {
    setSelectedProviderId(providerId);
    setMapFocus({ type: 'provider', id: providerId });
  };

  const handleSelectTier = (providerId, tierId) => {
    setSelectedTiers((prev) => ({ ...prev, [providerId]: tierId }));
  };

  const handleSelectItinerary = (itinerary) => {
    setMapFocus({ type: 'itinerary', id: itinerary.id });
  };

  const handleBook = () => {
    if (!selectedQuote) {
      return;
    }

    if (isOwnCarSelected) {
      // Own car: hand off to turn-by-turn navigation instead of booking.
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Mock request: replace with a live provider booking call when APIs land.
    setBookingStatus('requesting');
    bookingTimerRef.current = window.setTimeout(() => {
      setBookingStatus('confirmed');
    }, 1800);
  };

  const handleBookingDone = () => {
    setBookingStatus(null);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="z-20 flex items-center gap-3 border-b border-white/50 bg-white/70 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-lg font-extrabold tracking-tight">
          <span className="text-brand">One</span>
          <span className="text-accent">Ride</span>
        </span>
        <span className="ml-auto text-sm font-medium text-gray-500">Choose your ride</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="h-[38vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <MapView
            pickup={pickup}
            dropoff={dropoff}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
            routeGeoJson={routeGeoJson}
            className="h-full w-full"
          />
        </div>

        <aside className="relative flex min-h-0 flex-1 flex-col border-t border-gray-200 bg-gray-50 lg:order-1 lg:w-[400px] lg:flex-none lg:border-r lg:border-t-0">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 pb-24">
            <TripSummary pickup={pickup} dropoff={dropoff} />

            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-card">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                When
              </p>
              <TripTimingSelector
                timing={tripTiming}
                onChange={setTripTiming}
                compact
              />
            </div>

            {agentMeta ? (
              <div className="rounded-2xl border border-brand/20 bg-brand-light/50 px-3 py-2.5 text-xs text-brand-dark">
                <p className="font-semibold text-ink">From your request</p>
                <p className="mt-0.5 text-gray-600">“{agentMeta.prompt}”</p>
                {agentMeta.arriveBy ? (
                  <p className="mt-1 text-gray-600">
                    Arrive by{' '}
                    {new Date(agentMeta.arriveBy).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {quotes.some((q) => q.meetsArriveBy === false)
                      ? ' — some options may not make it'
                      : ''}
                  </p>
                ) : null}
                {agentMeta.source === 'heuristic' ? (
                  <p className="mt-1 text-amber-800">Parsed offline — OpenAI was unavailable.</p>
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-2">
              {Object.entries(SORT_MODES).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    sortMode === mode
                      ? 'bg-ink text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setHasOwnCar(!hasOwnCar)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                hasOwnCar
                  ? 'border-brand bg-brand-light/40 text-brand-dark'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>I have my own car</span>
              <span
                className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                  hasOwnCar ? 'bg-brand' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    hasOwnCar ? 'translate-x-4' : ''
                  }`}
                />
              </span>
            </button>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <RideComparison
              quotes={quotes}
              recommendedQuote={recommendedQuote}
              pickup={pickup}
              dropoff={dropoff}
              isLoading={isLoading}
              selectedProviderId={selectedQuote?.providerId ?? null}
              onSelectQuote={handleSelectQuote}
              selectedTiers={selectedTiers}
              onSelectTier={handleSelectTier}
            />

            <SmartRoutes
              itineraries={smartRoutes}
              isLoading={isLoading}
              selectedId={mapFocus?.type === 'itinerary' ? mapFocus.id : null}
              onSelect={handleSelectItinerary}
            />

            <button
              type="button"
              onClick={compareRoute}
              disabled={isLoading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {isLoading ? 'Refreshing…' : 'Refresh estimates'}
            </button>
          </div>

          {selectedQuote && !isLoading ? (
            <div className="glass-strong absolute bottom-0 left-0 right-0 z-10 border-x-0 border-b-0 p-4">
              <button
                type="button"
                onClick={handleBook}
                className="w-full rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
              >
                {isOwnCarSelected
                  ? `Get directions · ${formatAveragePrice(selectedQuote.priceLow, selectedQuote.priceHigh)} est.`
                  : `Book ${bookingQuote.providerName} · ${formatAveragePrice(bookingQuote.priceLow, bookingQuote.priceHigh)}`}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      <BookingSheet
        status={bookingStatus}
        quote={bookingQuote}
        pickup={pickup}
        dropoff={dropoff}
        onDone={handleBookingDone}
      />
    </div>
  );
}
