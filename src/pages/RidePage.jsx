import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import RideComparison from '../components/RideComparison.jsx';
import SmartRoutes from '../components/SmartRoutes.jsx';
import TripTracker from '../components/TripTracker.jsx';
import TripTimingSelector from '../components/TripTimingSelector.jsx';
import { SORT_MODES, PERSONAL_CAR } from '../constants/providers.js';
import { formatAveragePrice } from '../utils/formatters.js';
import { buildDirectRideGeoJson, buildItineraryGeoJson } from '../services/routeGeometry.js';
import { startRideSimulation, startItinerarySimulation } from '../services/tripSimulation.js';

function TripSummary({ pickup, dropoff }) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(47,230,168,0.15)]" />
          <span className="my-1 w-px flex-1 divider-dashed border-l" />
          <span className="h-2.5 w-2.5 rounded-sm bg-brand shadow-[0_0_0_3px_rgba(91,140,255,0.15)]" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-paper-faint">Pickup</p>
            <p className="truncate text-sm font-medium text-paper">{pickup?.label || '—'}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-paper-faint">Dropoff</p>
            <p className="truncate text-sm font-medium text-paper">{dropoff?.label || '—'}</p>
          </div>
        </div>
        <Link
          to="/"
          className="self-center rounded-full border border-surface-hair px-3 py-1.5 text-xs font-semibold text-paper-dim transition hover:border-signal/50 hover:text-signal"
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
  const [trip, setTrip] = useState(null);
  const [tripFareLabel, setTripFareLabel] = useState(null);
  const simulationRef = useRef(null);

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

  useEffect(() => () => simulationRef.current?.cancel(), []);

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
        geoJson = await buildDirectRideGeoJson(pickup, dropoff, quote?.brandColor ?? '#f6f2e9');
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

  const focusedItinerary =
    mapFocus?.type === 'itinerary' ? smartRoutes.find((item) => item.id === mapFocus.id) : null;

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

    // Simulated dispatch: replace with live provider booking calls when APIs land.
    setTripFareLabel(formatAveragePrice(bookingQuote.priceLow, bookingQuote.priceHigh));
    simulationRef.current = startRideSimulation({
      pickup,
      dropoff,
      quote: bookingQuote,
      onUpdate: setTrip,
    });
  };

  const handleStartItinerary = () => {
    if (!focusedItinerary) {
      return;
    }

    setTripFareLabel(formatAveragePrice(focusedItinerary.costLow, focusedItinerary.costHigh));
    simulationRef.current = startItinerarySimulation({
      itinerary: focusedItinerary,
      onUpdate: setTrip,
    });
  };

  const handleEndTrip = () => {
    simulationRef.current?.cancel();
    simulationRef.current = null;
    setTrip(null);
    setTripFareLabel(null);
  };

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <div className="z-20 flex items-center gap-3 border-b border-surface-hair bg-canvas/80 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="press flex h-9 w-9 items-center justify-center rounded-full border border-surface-hair text-paper-dim transition hover:border-signal/50 hover:text-signal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-wordmark text-lg text-paper">
          <span className="text-brand">One</span>
          <span className="text-accent">Ride</span>
        </span>
        <span className="ml-auto font-mono text-xs font-medium uppercase tracking-wide text-paper-faint">
          {trip ? 'On trip' : 'Choose your ride'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="h-[38vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <MapView
            pickup={pickup}
            dropoff={dropoff}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
            routeGeoJson={routeGeoJson}
            vehicle={
              trip?.position
                ? { position: trip.position, mode: trip.mode, color: trip.brandColor }
                : null
            }
            className="h-full w-full"
          />
        </div>

        <aside className="relative flex min-h-0 flex-1 flex-col border-t border-surface-hair bg-canvas lg:order-1 lg:w-[400px] lg:flex-none lg:border-r lg:border-t-0">
          {trip ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <TripSummary pickup={pickup} dropoff={dropoff} />
              <TripTracker
                trip={trip}
                fareLabel={tripFareLabel}
                onCancel={handleEndTrip}
                onDone={handleEndTrip}
              />
            </div>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 pb-24">
                <TripSummary pickup={pickup} dropoff={dropoff} />

                <div className="rounded-2xl border border-surface-hair bg-surface p-3 shadow-card">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-paper-faint">
                    When
                  </p>
                  <TripTimingSelector
                    timing={tripTiming}
                    onChange={setTripTiming}
                    compact
                  />
                </div>

                {agentMeta ? (
                  <div className="rounded-2xl border border-signal/25 bg-signal/10 px-3 py-2.5 text-xs text-paper-dim">
                    <p className="font-semibold text-paper">From your request</p>
                    <p className="mt-0.5">&ldquo;{agentMeta.prompt}&rdquo;</p>
                    {agentMeta.arriveBy ? (
                      <p className="mt-1">
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
                      <p className="mt-1 text-[#ffcc4d]">Parsed offline — OpenAI was unavailable.</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  {Object.entries(SORT_MODES).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSortMode(mode)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300 ease-expo ${
                        sortMode === mode
                          ? 'bg-signal text-signal-ink shadow-glow-sm'
                          : 'border border-surface-hair bg-surface/50 text-paper-dim hover:border-surface-hair-strong'
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
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-surface-hair bg-surface/50 text-paper-dim hover:border-surface-hair-strong'
                  }`}
                >
                  <span>I have my own car</span>
                  <span
                    className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-300 ${
                      hasOwnCar ? 'bg-accent' : 'bg-surface-raised'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-paper shadow transition-transform duration-300 ease-spring ${
                        hasOwnCar ? 'translate-x-4' : ''
                      }`}
                    />
                  </span>
                </button>

                {error ? (
                  <p className="rounded-xl border border-danger/40 bg-danger-light px-3 py-2 text-sm text-danger">
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
                  className="rounded-xl border border-surface-hair bg-surface/50 px-4 py-2.5 text-sm font-semibold text-paper-dim transition hover:border-signal/40 hover:text-signal disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing…' : 'Refresh estimates'}
                </button>
              </div>

              {selectedQuote && !isLoading ? (
                <div className="glass-strong absolute bottom-0 left-0 right-0 z-10 animate-rise-in border-x-0 border-b-0 p-4">
                  {focusedItinerary ? (
                    <button
                      type="button"
                      onClick={handleStartItinerary}
                      className="press w-full rounded-xl bg-signal px-4 py-3.5 text-sm font-semibold text-signal-ink shadow-glow transition hover:bg-[#ff8a5c]"
                    >
                      Start trip · {focusedItinerary.label} ·{' '}
                      <span className="font-sans tabular-nums">
                        {formatAveragePrice(focusedItinerary.costLow, focusedItinerary.costHigh)}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBook}
                      className="press w-full rounded-xl bg-signal px-4 py-3.5 text-sm font-semibold text-signal-ink shadow-glow transition hover:bg-[#ff8a5c]"
                    >
                      {isOwnCarSelected ? (
                        <>
                          Get directions ·{' '}
                          <span className="font-sans tabular-nums">
                            {formatAveragePrice(selectedQuote.priceLow, selectedQuote.priceHigh)} est.
                          </span>
                        </>
                      ) : (
                        <>
                          Book {bookingQuote.providerName} ·{' '}
                          <span className="font-sans tabular-nums">
                            {formatAveragePrice(bookingQuote.priceLow, bookingQuote.priceHigh)}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
