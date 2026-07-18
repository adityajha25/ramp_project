import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import LocationSearch from '../components/LocationSearch.jsx';
import TripTimingSelector from '../components/TripTimingSelector.jsx';
import { DEMO_ROUTES } from '../constants/nyc.js';
import { useVoiceDictation } from '../hooks/useVoiceDictation.js';

const TABS = [
  { id: 'manual', label: 'Book a ride' },
  { id: 'agent', label: 'Agent mode' },
];

const AGENT_EXAMPLES = [
  'get me to JFK by 6pm, cheapest option',
  'fastest ride to LaGuardia',
  'from Williamsburg to SoHo, best value',
];

function MicIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 1.5a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0v-6a3 3 0 0 1 3-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5a7.5 7.5 0 0 1-15 0M12 18.75v3.75M8.25 22.5h7.5"
      />
    </svg>
  );
}

function AgentModePanel({ onSubmit, isLoading, error }) {
  const [prompt, setPrompt] = useState('');

  const handleVoiceDone = useCallback(
    async (finalPrompt) => {
      const trimmed = finalPrompt.trim();
      if (trimmed) {
        await onSubmit(trimmed);
      }
    },
    [onSubmit]
  );

  const { isListening, isTranscribing, voiceError, toggleListening } = useVoiceDictation({
    prompt,
    setPrompt,
    disabled: isLoading,
    onStopCallback: handleVoiceDone,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onSubmit(prompt.trim());
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      // Stop → will call onStopCallback with the current prompt
      await toggleListening();
    } else {
      await toggleListening();
    }
  };

  const displayError = voiceError || error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-ink">Agent mode</p>
            {isListening && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                Listening…
              </span>
            )}
            {isTranscribing && !isListening && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Transcribing…
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Describe your trip in plain English or tap the mic to speak — then we&apos;ll rank your best
            rides.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text area + voice button row */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            placeholder={isListening ? 'Listening — speak now…' : 'Where do you want to go?'}
            disabled={isLoading}
            className={`w-full resize-none rounded-xl border bg-white/55 px-3 py-2.5 pr-14 text-sm text-ink backdrop-blur-sm placeholder:text-gray-400 focus:bg-white/85 focus:outline-none focus:ring-2 disabled:opacity-60 ${
              isListening
                ? 'border-red-400 focus:ring-red-400/50'
                : 'border-white/60 focus:ring-brand/50'
            }`}
          />

          {/* Voice toggle button — floated inside the textarea */}
          <button
            id="voice-toggle-btn"
            type="button"
            onClick={handleVoiceToggle}
            disabled={isLoading}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop recording' : 'Speak your trip'}
            className={`absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40 ${
              isListening
                ? 'bg-red-500 text-white shadow-red-300 hover:bg-red-600 focus:ring-red-400 animate-pulse'
                : 'border border-gray-200 bg-white text-gray-500 hover:border-brand hover:text-brand focus:ring-brand/50'
            }`}
          >
            <MicIcon className="h-4 w-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Planning your trip…' : 'Go'}
        </button>
      </form>

      {displayError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-600">
          {displayError}
        </p>
      ) : null}

      {!isListening && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {AGENT_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isLoading}
                onClick={() => setPrompt(example)}
                className="rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-left text-xs font-medium text-gray-600 backdrop-blur-sm transition hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage({ ride }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual');

  const {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    compareRoute,
    loadDemoRoute,
    runAgentTrip,
    tripTiming,
    setTripTiming,
    isLoading,
    error,
    setError,
  } = ride;

  const handleSeePrices = async () => {
    const ok = await compareRoute();
    if (ok) {
      navigate('/ride');
    }
  };

  const handleDemoRoute = async (route) => {
    const ok = await loadDemoRoute(route);
    if (ok) {
      navigate('/ride');
    }
  };

  const handleAgentSubmit = async (prompt) => {
    const ok = await runAgentTrip(prompt);
    if (ok) {
      navigate('/ride');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50">
      {/* Soft color field behind the glass surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-16 pt-10 sm:pt-14">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Where are you headed?
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Compare Uber, Lyft, Empower, and NYC Taxi — then book the best ride right here, without
            switching apps.
          </p>

          <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex rounded-full border border-white/60 bg-white/40 p-1 backdrop-blur-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError?.(null);
                  }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'manual' ? (
              <>
                <LocationSearch
                  pickup={pickup}
                  dropoff={dropoff}
                  onPickupChange={setPickup}
                  onDropoffChange={setDropoff}
                  onCompare={handleSeePrices}
                  isLoading={isLoading}
                  timingSelector={
                    <TripTimingSelector timing={tripTiming} onChange={setTripTiming} />
                  }
                />

                {error ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 border-t border-white/60 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Popular routes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_ROUTES.map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleDemoRoute(route)}
                        disabled={isLoading}
                        className="rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-sm transition hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        {route.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <AgentModePanel onSubmit={handleAgentSubmit} isLoading={isLoading} error={error} />
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>Book</span>
            <span className="font-semibold text-gray-500">Uber</span>
            <span>·</span>
            <span className="font-semibold text-gray-500">Lyft</span>
            <span>·</span>
            <span className="font-semibold text-gray-500">Empower</span>
            <span>·</span>
            <span className="font-semibold text-gray-500">NYC Taxi</span>
            <span>— all in one app</span>
          </div>
        </main>
      </div>
    </div>
  );
}
