import { useEffect, useRef, useState } from 'react';
import { geocodeAddress } from '../services/geocoding.js';

function ResultRow({ result, onSelect }) {
  const isLandmark = result.kind === 'landmark';
  const isPoi = result.kind === 'poi';

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(result)}
      className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-white/70"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">
            {result.shortLabel || result.label.split(',')[0]}
          </span>
          {isLandmark ? (
            <span className="shrink-0 rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
              Landmark
            </span>
          ) : isPoi ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Place
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-gray-400">{result.label}</span>
      </span>
    </button>
  );
}

function SearchField({ value, placeholder, onSelect, marker }) {
  const [query, setQuery] = useState(value?.label || '');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value?.label || '');
  }, [value]);

  useEffect(() => {
    if (!query.trim() || query === value?.label) {
      setResults([]);
      return undefined;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const nextResults = await geocodeAddress(query);
        setResults(nextResults);
      } catch (error) {
        setResults([]);
        setSearchError(error.message);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(debounceRef.current);
  }, [query, value]);

  const showDropdown = isFocused && (results.length > 0 || isSearching || searchError);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onSelect(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/55 px-3 backdrop-blur-sm transition focus-within:bg-white/85 focus-within:ring-2 focus-within:ring-brand/50">
        {marker}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 150)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-gray-400"
        />

        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear location"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="glass-strong absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl">
          {isSearching ? (
            <p className="px-3 py-2 text-xs text-gray-500">Searching landmarks &amp; places…</p>
          ) : null}

          {searchError ? (
            <p className="px-3 py-2 text-xs text-red-500">{searchError}</p>
          ) : null}

          {results.length > 0 ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <ResultRow
                    result={result}
                    onSelect={(selected) => {
                      onSelect(selected);
                      setQuery(selected.label);
                      setResults([]);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function LocationSearch({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  onCompare,
  isLoading,
  timingSelector,
}) {
  const canCompare = Boolean(pickup && dropoff);

  return (
    <div className="space-y-2.5">
      <SearchField
        value={pickup}
        placeholder="Pickup — address or landmark"
        onSelect={onPickupChange}
        marker={<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
      />

      <SearchField
        value={dropoff}
        placeholder="Where to? — JFK, Empire State, etc."
        onSelect={onDropoffChange}
        marker={<span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-brand" />}
      />

      {timingSelector ? <div className="pt-1">{timingSelector}</div> : null}

      <button
        type="button"
        onClick={onCompare}
        disabled={!canCompare || isLoading}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isLoading ? 'Comparing rides…' : 'See prices'}
      </button>
    </div>
  );
}
