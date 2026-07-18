import { useState } from 'react';
import { formatAveragePrice, formatCurrency, formatDuration } from '../utils/formatters.js';

function LegIcon({ mode }) {
  if (mode === 'walk') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <circle cx="12" cy="5" r="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5 10 13l-2.5 6M12 7.5l2 4 3 1.5M10 13l3 2 1 5" />
      </svg>
    );
  }

  if (mode === 'ride') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14M5 11a2 2 0 0 0-2 2v3h2m14-5a2 2 0 0 1 2 2v3h-2m-12 0a1.5 1.5 0 1 1-3 0m15 0a1.5 1.5 0 1 1-3 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="6" y="3" width="12" height="14" rx="2.5" />
      <path strokeLinecap="round" d="M6 11h12M9.5 17 8 20m6.5-3 1.5 3M9.5 14h.01M14.5 14h.01" />
    </svg>
  );
}

function LineBullet({ segment }) {
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
      style={{ backgroundColor: segment.color, color: segment.textColor }}
    >
      {segment.lineName}
    </span>
  );
}

function SubwayBullets({ segments }) {
  return (
    <span className="inline-flex items-center gap-1">
      {segments.map((segment, index) => (
        <span key={`${segment.lineId}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-gray-300">→</span> : null}
          <LineBullet segment={segment} />
        </span>
      ))}
    </span>
  );
}

function LegRow({ leg }) {
  let description;
  let detail;

  if (leg.mode === 'walk') {
    description = `Walk to ${leg.toLabel}`;
    detail = `${leg.miles} mi`;
  } else if (leg.mode === 'ride') {
    description = `${leg.providerName} to ${leg.toLabel}`;
    detail = formatAveragePrice(leg.costLow, leg.costHigh);
  } else {
    description = `${leg.fromLabel} → ${leg.toLabel}`;
    detail =
      leg.transfers > 0
        ? `${leg.transfers} transfer${leg.transfers > 1 ? 's' : ''} · ${formatCurrency(leg.costLow)}`
        : formatCurrency(leg.costLow);
  }

  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
        style={{
          backgroundColor:
            leg.mode === 'walk' ? '#9ca3af' : leg.mode === 'ride' ? leg.brandColor : '#1f2937',
        }}
      >
        <LegIcon mode={leg.mode} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{description}</span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDuration(leg.minutes)}</span>
          <span>·</span>
          {leg.mode === 'subway' ? <SubwayBullets segments={leg.segments} /> : <span>{detail}</span>}
          {leg.mode === 'subway' ? <span className="text-gray-400">{detail}</span> : null}
        </span>
      </span>
    </li>
  );
}

/**
 * Turn-by-turn style steps, like Apple/Google transit directions.
 * Boarding, riding, getting off, and each transfer are separate steps.
 */
function buildDetailedSteps(itinerary) {
  const steps = [];

  for (const leg of itinerary.legs) {
    if (leg.mode === 'walk') {
      steps.push({
        title: `Walk to ${leg.toLabel}`,
        detail: `${leg.miles} mi · about ${formatDuration(leg.minutes)}`,
      });
    } else if (leg.mode === 'ride') {
      steps.push({
        title: `Take ${leg.providerName} to ${leg.toLabel}`,
        detail: `About ${formatDuration(leg.minutes)} incl. pickup wait · ${formatAveragePrice(leg.costLow, leg.costHigh)}`,
      });
    } else {
      leg.segments.forEach((segment, index) => {
        if (index > 0) {
          steps.push({
            title: `Transfer to the ${segment.lineName} train`,
            detail: `At ${segment.fromName} — follow the in-station signs to the ${segment.lineName} platform`,
            segment,
          });
        }

        steps.push({
          title: `Board the ${segment.lineName} train at ${segment.fromName}`,
          detail: `Toward ${segment.toName} · runs every ~${leg.headwayMinutes} min right now`,
          segment,
        });

        steps.push({
          title: `Get off at ${segment.toName}`,
          detail: `${segment.stops} stop${segment.stops > 1 ? 's' : ''} · about ${formatDuration(segment.minutes)}`,
          segment,
        });
      });
    }
  }

  steps.push({ title: 'Arrive at your destination', detail: null });
  return steps;
}

function ItineraryCard({ itinerary, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  const showSavings = itinerary.savingsVsDirect >= 1;
  const isFaster = itinerary.minutesVsDirect < 0;

  return (
    <article
      className={`rounded-2xl border bg-white shadow-card transition ${
        isSelected ? 'border-brand ring-2 ring-brand/30' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">{itinerary.label}</h3>
              {showSavings ? (
                <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-dark">
                  Save {formatCurrency(itinerary.savingsVsDirect)}
                </span>
              ) : null}
              {isFaster ? (
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                  Faster than driving
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatDuration(itinerary.totalMinutes)}
              {itinerary.minutesVsDirect > 0
                ? ` · +${Math.round(itinerary.minutesVsDirect)} min vs direct ride`
                : ''}
            </p>
          </div>
          <p className="shrink-0 text-base font-semibold text-ink">
            {formatAveragePrice(itinerary.costLow, itinerary.costHigh)}
          </p>
        </div>

        <ul className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
          {itinerary.legs.map((leg, index) => (
            <LegRow key={index} leg={leg} />
          ))}
        </ul>
      </button>

      <div className="border-t border-gray-100 px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between text-xs font-semibold text-gray-500 transition hover:text-brand"
        >
          <span>{expanded ? 'Hide directions' : 'Step-by-step directions'}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {expanded ? (
          <ol className="mt-3 space-y-3">
            {buildDetailedSteps(itinerary).map((step, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {step.segment ? <LineBullet segment={step.segment} /> : null}
                    <span>{step.title}</span>
                  </span>
                  {step.detail ? (
                    <span className="mt-0.5 block text-xs text-gray-500">{step.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </article>
  );
}

export default function SmartRoutes({ itineraries, isLoading, selectedId, onSelect }) {
  if (isLoading) {
    return null;
  }

  if (!itineraries || itineraries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-sm font-bold text-ink">Smart routes</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Subway + rides
        </span>
      </div>

      {itineraries.map((itinerary) => (
        <ItineraryCard
          key={itinerary.id}
          itinerary={itinerary}
          isSelected={itinerary.id === selectedId}
          onSelect={() => onSelect(itinerary)}
        />
      ))}

      <p className="text-xs text-gray-400">
        Tap a route to see it on the map. Transit times adjust for current headways; $2.90 subway
        fare via OMNY.
      </p>
    </section>
  );
}
