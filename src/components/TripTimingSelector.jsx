import { TRIP_TIMING_MODES } from '../constants/tripTiming.js';
import { formatTime } from '../utils/formatters.js';

export default function TripTimingSelector({ timing, onChange, compact = false }) {
  const { mode, datetime } = timing;

  const handleModeChange = (nextMode) => {
    onChange({
      mode: nextMode,
      datetime:
        nextMode === TRIP_TIMING_MODES.leaveNow
          ? null
          : datetime ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  };

  const handleDatetimeChange = (event) => {
    const value = event.target.value;
    onChange({
      mode,
      datetime: value ? new Date(value).toISOString() : null,
    });
  };

  const datetimeLocalValue = datetime
    ? new Date(datetime).toISOString().slice(0, 16)
    : '';

  const modeLabels = {
    [TRIP_TIMING_MODES.leaveNow]: 'Leave now',
    [TRIP_TIMING_MODES.leaveAt]: 'Leave at',
    [TRIP_TIMING_MODES.arriveBy]: 'Arrive by',
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex gap-1.5">
        {Object.entries(modeLabels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleModeChange(key)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition ${
              mode === key
                ? 'bg-ink text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== TRIP_TIMING_MODES.leaveNow ? (
        <input
          type="datetime-local"
          value={datetimeLocalValue}
          onChange={handleDatetimeChange}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      ) : (
        <p className="text-xs text-gray-400">
          Departing now · estimates use current traffic &amp; train headways
        </p>
      )}

      {mode !== TRIP_TIMING_MODES.leaveNow && datetime ? (
        <p className="text-xs text-gray-500">
          {mode === TRIP_TIMING_MODES.arriveBy ? 'Arrive by' : 'Leave at'}{' '}
          <span className="font-semibold text-ink">{formatTime(datetime)}</span>
        </p>
      ) : null}
    </div>
  );
}
