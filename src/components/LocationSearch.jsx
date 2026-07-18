import { useEffect, useRef, useState } from 'react';
import { geocodeAddress } from '../services/geocoding.js';

function SearchField({ label, value, placeholder, onSelect }) {
  const [query, setQuery] = useState(value?.label || '');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value?.label || '');
  }, [value]);

  useEffect(() => {
    if (!query.trim()) {
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
  }, [query]);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none ring-brand/40 placeholder:text-slate-500 focus:border-brand focus:ring-2"
      />

      {isSearching ? (
        <p className="mt-1 text-xs text-slate-500">Searching NYC addresses…</p>
      ) : null}

      {searchError ? (
        <p className="mt-1 text-xs text-red-300">{searchError}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(result);
                  setQuery(result.label);
                  setResults([]);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

export default function LocationSearch({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  onCompare,
  isLoading,
}) {
  const canCompare = Boolean(pickup && dropoff);

  return (
    <div className="space-y-3">
      <SearchField
        label="Pickup"
        value={pickup}
        placeholder="Times Square, Manhattan"
        onSelect={onPickupChange}
      />

      <SearchField
        label="Dropoff"
        value={dropoff}
        placeholder="JFK Airport, Queens"
        onSelect={onDropoffChange}
      />

      <button
        type="button"
        onClick={onCompare}
        disabled={!canCompare || isLoading}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isLoading ? 'Comparing rides…' : 'Compare all rides'}
      </button>
    </div>
  );
}
