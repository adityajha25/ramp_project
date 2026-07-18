import { STATIONS, SUBWAY_LINES } from '../data/subwayNetwork.js';
import { distanceInMiles } from '../utils/formatters.js';

/**
 * Lightweight subway router over the curated network.
 *
 * Nodes are (station, line) pairs so line changes incur a transfer penalty.
 * Waits and crowding scale with time of day; segment times are
 * distance-based — replace with GTFS stop_times in Phase 2.
 */

const AVG_TRAIN_SPEED_MPH = 17;
const DWELL_MINUTES = 0.6;
const TRANSFER_WALK_MINUTES = 2;

/**
 * Typical minutes between trains right now (varies by time of day).
 */
export function getHeadwayMinutes(date = new Date()) {
  const hour = date.getHours();
  const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;

  if (isWeekday && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 20))) {
    return 3; // rush hour
  }
  if (hour >= 22 || hour < 6) {
    return 12; // late night
  }
  if (hour >= 20 || !isWeekday) {
    return 8; // evenings and weekends
  }
  return 5; // midday
}

/**
 * Trains crawl slightly at rush hour (congestion, crowded dwell times).
 */
function getRideDelayFactor(date = new Date()) {
  const hour = date.getHours();
  const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;

  if (isWeekday && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 20))) {
    return 1.12;
  }
  return 1;
}

function nodeKey(stationId, lineId) {
  return `${stationId}|${lineId}`;
}

function segmentMinutes(aId, bId) {
  const miles = distanceInMiles(STATIONS[aId], STATIONS[bId]);
  return Math.max((miles / AVG_TRAIN_SPEED_MPH) * 60 + DWELL_MINUTES, 1.5);
}

function buildGraph() {
  const edges = new Map(); // nodeKey -> [{ to, minutes, kind: 'ride'|'transfer' }]
  const linesAtStation = new Map(); // stationId -> Set<lineId>

  const addEdge = (from, to, minutes, kind) => {
    if (!edges.has(from)) {
      edges.set(from, []);
    }
    edges.get(from).push({ to, minutes, kind });
  };

  for (const line of SUBWAY_LINES) {
    for (let i = 0; i < line.stations.length; i += 1) {
      const stationId = line.stations[i];
      if (!linesAtStation.has(stationId)) {
        linesAtStation.set(stationId, new Set());
      }
      linesAtStation.get(stationId).add(line.id);

      if (i > 0) {
        const prevId = line.stations[i - 1];
        const minutes = segmentMinutes(prevId, stationId);
        addEdge(nodeKey(prevId, line.id), nodeKey(stationId, line.id), minutes, 'ride');
        addEdge(nodeKey(stationId, line.id), nodeKey(prevId, line.id), minutes, 'ride');
      }
    }
  }

  // Transfer edges between lines at the same station (wait added at query time).
  for (const [stationId, lineIds] of linesAtStation) {
    const ids = [...lineIds];
    for (const a of ids) {
      for (const b of ids) {
        if (a !== b) {
          addEdge(nodeKey(stationId, a), nodeKey(stationId, b), TRANSFER_WALK_MINUTES, 'transfer');
        }
      }
    }
  }

  return { edges, linesAtStation };
}

const GRAPH = buildGraph();

/**
 * Returns the nearest stations to a point, sorted by straight-line distance.
 */
export function findNearestStations(point, { limit = 3, maxMiles = 1.5 } = {}) {
  return Object.entries(STATIONS)
    .map(([id, station]) => ({
      id,
      ...station,
      miles: distanceInMiles(point, station),
    }))
    .filter((station) => station.miles <= maxMiles)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}

/**
 * Dijkstra between two stations, traffic-aware (headway + rush delays).
 * Returns null when no path exists.
 */
export function routeBetweenStations(fromStationId, toStationId, date = new Date()) {
  if (fromStationId === toStationId) {
    return { minutes: 0, transfers: 0, segments: [], headwayMinutes: getHeadwayMinutes(date) };
  }

  const startLines = GRAPH.linesAtStation.get(fromStationId);
  const endLines = GRAPH.linesAtStation.get(toStationId);
  if (!startLines || !endLines) {
    return null;
  }

  const headway = getHeadwayMinutes(date);
  const boardingWait = headway / 2 + 1;
  const rideDelayFactor = getRideDelayFactor(date);

  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const queue = [];

  for (const lineId of startLines) {
    const key = nodeKey(fromStationId, lineId);
    dist.set(key, boardingWait);
    queue.push(key);
  }

  while (queue.length > 0) {
    // Small graph — linear scan beats maintaining a heap.
    let bestIdx = 0;
    for (let i = 1; i < queue.length; i += 1) {
      if (dist.get(queue[i]) < dist.get(queue[bestIdx])) {
        bestIdx = i;
      }
    }
    const current = queue.splice(bestIdx, 1)[0];
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    for (const edge of GRAPH.edges.get(current) ?? []) {
      const weight =
        edge.kind === 'transfer'
          ? edge.minutes + headway / 2 // wait for the next train after transferring
          : edge.minutes * rideDelayFactor;

      const alt = dist.get(current) + weight;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, current);
        queue.push(edge.to);
      }
    }
  }

  let endKey = null;
  for (const lineId of endLines) {
    const key = nodeKey(toStationId, lineId);
    if (dist.has(key) && (endKey === null || dist.get(key) < dist.get(endKey))) {
      endKey = key;
    }
  }
  if (!endKey) {
    return null;
  }

  // Reconstruct the node path, then collapse into per-line segments.
  const path = [endKey];
  while (prev.has(path[0])) {
    path.unshift(prev.get(path[0]));
  }

  const segments = [];
  for (const key of path) {
    const [stationId, lineId] = key.split('|');
    const last = segments[segments.length - 1];
    if (last && last.lineId === lineId) {
      if (last.stationIds[last.stationIds.length - 1] !== stationId) {
        last.stationIds.push(stationId);
        last.endMinutes = dist.get(key);
      }
    } else {
      segments.push({
        lineId,
        stationIds: [stationId],
        startMinutes: dist.get(key),
        endMinutes: dist.get(key),
      });
    }
  }

  const realSegments = segments
    .filter((segment) => segment.stationIds.length > 1)
    .map((segment) => {
      const line = SUBWAY_LINES.find((item) => item.id === segment.lineId);
      const fromId = segment.stationIds[0];
      const toId = segment.stationIds[segment.stationIds.length - 1];

      return {
        lineId: segment.lineId,
        lineName: line.name,
        color: line.color,
        textColor: line.textColor ?? '#ffffff',
        fromId,
        toId,
        fromName: STATIONS[fromId].name,
        toName: STATIONS[toId].name,
        stops: segment.stationIds.length - 1,
        minutes: Math.max(Math.round(segment.endMinutes - segment.startMinutes), 1),
        stationIds: segment.stationIds,
        coordinates: segment.stationIds.map((id) => [STATIONS[id].lng, STATIONS[id].lat]),
      };
    });

  if (realSegments.length === 0) {
    return null;
  }

  return {
    minutes: Math.round(dist.get(endKey)),
    transfers: realSegments.length - 1,
    segments: realSegments,
    headwayMinutes: headway,
  };
}

export function getStation(stationId) {
  return { id: stationId, ...STATIONS[stationId] };
}
