import Constants from "expo-constants";

import { decodePolyline, slicePath, type LatLng } from "@/lib/polyline";

// Transit's public API (https://transitapp.com/apis) — the same feed the
// Transit app uses, which covers Madison Metro (agency prefix `MMTWI`) and so
// includes the free campus routes 80/81/82/84.
const TRANSIT_BASE_URL = "https://external.transitapp.com/v3/public";

// How far from a point we still consider a stop reachable on foot.
const MAX_STOP_DISTANCE_METERS = 600;
// Transit rate-limits bursts hard (HTTP 429), so hold recent responses briefly.
// Departures are absolute timestamps, so a cached response is re-pruned on read
// rather than being wrong.
const CACHE_TTL_MS = 60_000;
// Average walking speed, for turning stop distance into minutes.
const WALK_SPEED_MPS = 1.35;
// Slack on top of the walk to the stop — a bus you cannot reach is not an option.
const CATCH_BUFFER_SECONDS = 60;
// A ride shorter than this is not worth the two walks around it.
const MIN_RIDE_SECONDS = 120;

/**
 * The key is read from `EXPO_PUBLIC_TRANSIT_API_KEY` (see .env.example), with
 * `extra.transitApiKey` in app.json as a fallback for builds that set config
 * rather than env vars. Both are bundled in plain text — Transit issues these
 * `transit_publicapi_*` keys for client-side use, but treat the key as public
 * and rotate it from the Transit dashboard if it gets abused.
 */
function getApiKey(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_TRANSIT_API_KEY;
  if (fromEnv) return fromEnv;
  const fromConfig = Constants.expoConfig?.extra?.transitApiKey;
  return typeof fromConfig === "string" && fromConfig ? fromConfig : undefined;
}

export class TransitNotConfiguredError extends Error {
  constructor() {
    super("No Transit API key configured");
    this.name = "TransitNotConfiguredError";
  }
}

/** Thrown only when rate-limited with no cached response to fall back on. */
export class TransitRateLimitedError extends Error {
  constructor() {
    super("Transit API rate limit reached");
    this.name = "TransitRateLimitedError";
  }
}

/** One end-to-end bus leg: where to board, what to ride, where to get off. */
export interface BusPlan {
  /** Agency-scoped id, e.g. "MMTWI:31679" — the key for `route_details`. */
  globalRouteId: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
  headsign: string;
  boardStopId: string;
  boardStopName: string;
  boardWalkMeters: number;
  boardStopLat: number;
  boardStopLng: number;
  alightStopId: string;
  alightStopName: string;
  alightWalkMeters: number;
  alightStopLat: number;
  alightStopLng: number;
  /** Unix seconds. */
  departureTime: number;
  arrivalTime: number;
  isRealTime: boolean;
  hasAlerts: boolean;
}

interface RawScheduleItem {
  departure_time: number;
  is_real_time: boolean;
  is_cancelled: boolean;
  rt_trip_id?: string;
}

interface RawItinerary {
  merged_headsign?: string;
  headsign?: string;
  closest_stop?: {
    global_stop_id?: string;
    stop_name?: string;
    stop_lat?: number;
    stop_lon?: number;
  };
  schedule_items?: RawScheduleItem[];
}

interface RawRoute {
  global_route_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_color?: string;
  route_text_color?: string;
  alerts?: unknown[];
  itineraries?: RawItinerary[];
}

/** Great-circle distance in metres. */
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** GTFS colors come back as bare hex ("2272b5") and are sometimes missing. */
function toHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const hex = value.replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : fallback;
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_SPEED_MPS / 60));
}

const cache = new Map<string, { fetchedAt: number; routes: RawRoute[] }>();

function cacheKey(lat: number, lng: number): string {
  // ~11 m of precision: enough that two spots never share an entry.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Raw `nearby_routes` for a point, cached briefly.
 *
 * `findBusPlan` calls this once per trip end, and the routes screen re-plans on
 * a timer, so the cache is what keeps a single screen from burning through the
 * rate limit.
 */
async function fetchRaw(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<RawRoute[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new TransitNotConfiguredError();

  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.routes;

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    max_distance: String(MAX_STOP_DISTANCE_METERS),
    should_update_realtime: "true"
  });

  const res = await fetch(`${TRANSIT_BASE_URL}/nearby_routes?${query}`, {
    headers: { apiKey },
    signal
  });

  if (res.status === 429) {
    // Rather than surface a rate limit the user can do nothing about, serve
    // the last response for this point — stale minutes beat an error card.
    if (cached) return cached.routes;
    throw new TransitRateLimitedError();
  }
  if (!res.ok) throw new Error(`Transit API returned ${res.status}`);

  const body = (await res.json()) as { routes?: RawRoute[] };
  const routes = body.routes ?? [];
  cache.set(key, { fetchedAt: Date.now(), routes });
  return routes;
}

interface TripStop {
  time: number;
  isRealTime: boolean;
  stopId: string;
  stopName: string;
  stopDistanceMeters: number;
  stopLat: number;
  stopLng: number;
  route: RawRoute;
  headsign: string;
}

/**
 * Every upcoming trip that touches a stop near this point, keyed by the
 * real-time trip id — the same id the same bus carries at every stop it makes.
 */
function buildTripIndex(
  routes: RawRoute[],
  lat: number,
  lng: number
): Map<string, TripStop> {
  const index = new Map<string, TripStop>();

  for (const route of routes) {
    for (const itinerary of route.itineraries ?? []) {
      const stop = itinerary.closest_stop;
      const stopLat = stop?.stop_lat;
      const stopLon = stop?.stop_lon;
      if (!stop || typeof stopLat !== "number" || typeof stopLon !== "number") continue;

      const stopDistanceMeters = distanceMeters(lat, lng, stopLat, stopLon);
      if (stopDistanceMeters > MAX_STOP_DISTANCE_METERS) continue;

      for (const item of itinerary.schedule_items ?? []) {
        if (!item.rt_trip_id || item.is_cancelled) continue;
        const existing = index.get(item.rt_trip_id);
        // A loop route can pass the same point twice; keep the nearer stop.
        if (existing && existing.stopDistanceMeters <= stopDistanceMeters) continue;
        index.set(item.rt_trip_id, {
          time: item.departure_time,
          isRealTime: Boolean(item.is_real_time),
          stopId: stop.global_stop_id ?? "",
          stopName: stop.stop_name ?? "Nearby stop",
          stopDistanceMeters: Math.round(stopDistanceMeters),
          stopLat,
          stopLng: stopLon,
          route,
          headsign: itinerary.merged_headsign || itinerary.headsign || ""
        });
      }
    }
  }
  return index;
}

/**
 * The best single-bus leg from origin to destination, or null when no route
 * links them without a transfer.
 *
 * Transit's public API has no trip planner, so this pairs the two endpoints by
 * real-time trip id: the same physical bus seen near the origin and near the
 * destination. Whether it reaches the destination *after* the origin is what
 * establishes direction — comparing stop positions cannot, because a route
 * running the wrong way passes the same stops in the opposite order.
 *
 * The limitation that remains: single-bus trips only, no transfers.
 */
export async function findBusPlan(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  options?: { signal?: AbortSignal }
): Promise<BusPlan | null> {
  const [fromRaw, toRaw] = await Promise.all([
    fetchRaw(origin.lat, origin.lng, options?.signal),
    fetchRaw(dest.lat, dest.lng, options?.signal)
  ]);

  const boarding = buildTripIndex(fromRaw, origin.lat, origin.lng);
  const alighting = buildTripIndex(toRaw, dest.lat, dest.lng);
  const nowSeconds = Math.floor(Date.now() / 1000);

  let best: BusPlan | null = null;
  for (const [tripId, board] of boarding) {
    const alight = alighting.get(tripId);
    if (!alight) continue;

    // Direction: this bus must reach the destination after leaving the origin.
    if (alight.time - board.time < MIN_RIDE_SECONDS) continue;

    // Catchability: no use recommending a bus that leaves before you arrive.
    const earliest =
      nowSeconds + board.stopDistanceMeters / WALK_SPEED_MPS + CATCH_BUFFER_SECONDS;
    if (board.time < earliest) continue;

    // Rank by when you actually get there, not when the bus leaves.
    if (best && alight.time >= best.arrivalTime) continue;

    best = {
      globalRouteId: board.route.global_route_id ?? "",
      shortName: board.route.route_short_name ?? "",
      longName: board.route.route_long_name ?? "",
      color: toHexColor(board.route.route_color, "#C5050C"),
      textColor: toHexColor(board.route.route_text_color, "#FFFFFF"),
      headsign: board.headsign,
      boardStopId: board.stopId,
      boardStopName: board.stopName,
      boardWalkMeters: board.stopDistanceMeters,
      boardStopLat: board.stopLat,
      boardStopLng: board.stopLng,
      alightStopId: alight.stopId,
      alightStopName: alight.stopName,
      alightWalkMeters: alight.stopDistanceMeters,
      alightStopLat: alight.stopLat,
      alightStopLng: alight.stopLng,
      departureTime: board.time,
      arrivalTime: alight.time,
      isRealTime: board.isRealTime,
      hasAlerts: (board.route.alerts?.length ?? 0) > 0
    };
  }
  return best;
}

// ── Route shapes ────────────────────────────────────────────────────────────

// Transit encodes route shapes at 5 decimal places (the classic polyline
// format), unlike Valhalla's 6.
const TRANSIT_POLYLINE_PRECISION = 5;

interface RawShapeItinerary {
  merged_headsign?: string;
  headsign?: string;
  shape?: string;
  stops?: { global_stop_id?: string; stop_lat?: number; stop_lon?: number }[];
}

// Only definitive answers are cached. A 429 or a dropped connection is
// transient, and caching it would leave the leg drawn as a straight line for
// the rest of the session even once the API recovers.
const shapeCache = new Map<string, LatLng[] | null>();

/**
 * The path a bus actually drives between two stops.
 *
 * `route_details` returns one entry per itinerary, each with an encoded shape
 * and its ordered stop list. A route has many itineraries — Route 80 alone
 * returns twelve, differing by branch and short-turn — so the right one is the
 * one that serves both ends of this leg, in that order.
 *
 * Stops are matched by position, not by id: `nearby_routes` and `route_details`
 * report the same physical stop under different ids (Route F's "Orchard" is
 * MMTWI:32037 in one and MMTWI:32120 in the other, 61 m apart — opposite
 * platforms of one station). Requiring the boarding stop to come before the
 * alighting stop in the itinerary's own order also confirms the direction.
 *
 * Returns null when no itinerary covers the pair, leaving the caller to draw a
 * straight line.
 */
export async function fetchBusLegShape(
  plan: BusPlan,
  options?: { signal?: AbortSignal }
): Promise<LatLng[] | null> {
  if (!plan.globalRouteId) return null;

  const board: LatLng = { lat: plan.boardStopLat, lng: plan.boardStopLng };
  const alight: LatLng = { lat: plan.alightStopLat, lng: plan.alightStopLng };
  const key = `${plan.globalRouteId}|${plan.headsign}|${plan.boardStopId}|${plan.alightStopId}`;

  const cached = shapeCache.get(key);
  if (cached !== undefined) return cached;

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const query = new URLSearchParams({ global_route_id: plan.globalRouteId });
    const res = await fetch(`${TRANSIT_BASE_URL}/route_details?${query}`, {
      headers: { apiKey },
      signal: options?.signal
    });
    // Transient — do not cache, so the next refresh can try again.
    if (!res.ok) return null;

    const body = (await res.json()) as { itineraries?: RawShapeItinerary[] };
    const itineraries = body.itineraries ?? [];

    // Two platforms of one station sit ~60 m apart; a different stop is much
    // further, so this tolerance separates them without matching the wrong one.
    const STOP_MATCH_METERS = 150;

    const indexOfNearest = (it: RawShapeItinerary, point: LatLng) => {
      let bestIndex = -1;
      let bestDistance = STOP_MATCH_METERS;
      (it.stops ?? []).forEach((stop, index) => {
        if (typeof stop.stop_lat !== "number" || typeof stop.stop_lon !== "number") return;
        const d = distanceMeters(point.lat, point.lng, stop.stop_lat, stop.stop_lon);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = index;
        }
      });
      return bestIndex;
    };

    // Serves both ends, boarding first.
    const covers = (it: RawShapeItinerary) => {
      const from = indexOfNearest(it, board);
      const to = indexOfNearest(it, alight);
      return from >= 0 && to >= 0 && from < to;
    };

    const match =
      itineraries.find(
        (it) => covers(it) && (it.merged_headsign || it.headsign) === plan.headsign
      ) ?? itineraries.find(covers);

    if (!match?.shape) {
      // Definitive: this route genuinely has no itinerary covering both stops.
      shapeCache.set(key, null);
      return null;
    }

    const full = decodePolyline(match.shape, TRANSIT_POLYLINE_PRECISION);
    const leg = slicePath(full, board, alight);
    shapeCache.set(key, leg);
    return leg;
  } catch {
    // Offline or aborted — transient, so leave the cache alone.
    return null;
  }
}
