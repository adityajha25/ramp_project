function statusLine(trip) {
  const to = trip.toLabel?.split(',')[0] || 'your destination';

  switch (trip.phase) {
    case 'assigning':
      return { title: `Requesting your ${trip.providerName}…`, detail: 'Matching you with a nearby driver' };
    case 'toPickup':
      return {
        title: `${trip.driver.firstName} is on the way`,
        detail: `Arriving in about ${trip.remainingMinutes} min`,
      };
    case 'arrivedAtPickup':
      return {
        title: `${trip.driver.firstName} has arrived`,
        detail: `Look for the ${trip.driver.car.color.toLowerCase()} ${trip.driver.car.make} ${trip.driver.car.model}`,
      };
    case 'inTrip':
      return {
        title: `Heading to ${to}`,
        detail: `About ${trip.remainingMinutes} min remaining`,
      };
    case 'walking':
      return { title: `Walk to ${to}`, detail: `About ${trip.remainingMinutes} min at a normal pace` };
    case 'onTransit':
      return { title: `On the subway to ${to}`, detail: `About ${trip.remainingMinutes} min to your stop` };
    case 'completed':
      return { title: 'You’ve arrived!', detail: `Dropped off at ${to}` };
    default:
      return { title: 'Preparing your trip…', detail: null };
  }
}

function DriverCard({ driver, plateLabel, brandColor, providerName }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-card">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
        style={{ backgroundColor: brandColor || '#0f172a' }}
      >
        {driver.firstName.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {driver.firstName} {driver.lastInitial}.
          <span className="ml-2 text-xs font-medium text-gray-500">★ {driver.rating}</span>
        </p>
        <p className="truncate text-xs text-gray-500">
          {driver.car.color} {driver.car.make} {driver.car.model} · {providerName}
        </p>
      </div>
      <span className="shrink-0 rounded-lg border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs font-bold tracking-wider text-ink">
        {plateLabel}
      </span>
    </div>
  );
}

export default function TripTracker({ trip, fareLabel, onCancel, onDone }) {
  if (!trip) {
    return null;
  }

  const { title, detail } = statusLine(trip);
  const isCompleted = trip.phase === 'completed';
  const isMultiLeg = trip.legCount > 1;
  const showDriver = trip.driver && !isCompleted;
  const progress = Math.round((trip.progress ?? 0) * 100);

  return (
    <div className="space-y-3">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {isMultiLeg && !isCompleted ? (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Leg {trip.legIndex + 1} of {trip.legCount}
              </p>
            ) : null}
            <p className="text-base font-bold text-ink">{title}</p>
            {detail ? <p className="mt-0.5 text-sm text-gray-500">{detail}</p> : null}
          </div>

          {isCompleted ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
          ) : trip.phase === 'assigning' ? (
            <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-brand" />
          ) : null}
        </div>

        {!isCompleted && trip.phase !== 'assigning' ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200/80">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      {showDriver ? (
        <DriverCard
          driver={trip.driver}
          plateLabel={trip.driver.plate}
          brandColor={trip.brandColor}
          providerName={trip.providerName}
        />
      ) : null}

      {isCompleted && fareLabel ? (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
          <span className="text-sm text-gray-500">Trip total</span>
          <span className="text-lg font-bold text-ink">{fareLabel}</span>
        </div>
      ) : null}

      <p className="text-xs text-gray-400">
        Simulated demo — driver, car, and movement are generated. Live dispatch replaces this once
        provider APIs are connected.
      </p>

      {isCompleted ? (
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Done
        </button>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
        >
          Cancel trip
        </button>
      )}
    </div>
  );
}
