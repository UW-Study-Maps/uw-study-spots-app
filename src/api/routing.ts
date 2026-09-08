import Constants from "expo-constants";

import { decodePolyline, type LatLng } from "@/lib/polyline";

/**
 * Street-level routing for the two modes transit cannot answer.
 *
 * Valhalla is used because its `pedestrian` and `bicycle` costings are genuinely
 * distinct — for a campus trip it returns 15.4 min on foot against 4.3 min by
 * bike over different paths. (OSRM's public demo server was tried first and
 * rejected: it answers every profile with the same car route.)
 *
 * The default endpoint is the OpenStreetMap community demo server, which has a
 * fair-use policy and no uptime guarantee. Point
 * `EXPO_PUBLIC_VALHALLA_URL` at your own instance or a paid provider before
 * shipping; when it is unreachable the caller falls back to straight lines.
 */
const DEFAULT_VALHALLA_URL = "https://valhalla1.openstreetmap.de";
// Valhalla encodes shapes at 6 decimal places, unlike the 5 that Google's
// original polyline format — and Transit's route shapes — use.
const VALHALLA_POLYLINE_PRECISION = 6;
const REQUEST_TIMEOUT_MS = 8000;

export type Costing = "pedestrian" | "bicycle";

export interface RoutedPath {
  /** Street geometry, not a straight line. */
  points: LatLng[];
  meters: number;
  seconds: number;
}

function baseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_VALHALLA_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromConfig = Constants.expoConfig?.extra?.valhallaUrl;
  if (typeof fromConfig === "string" && fromConfig) return fromConfig.replace(/\/$/, "");
  return DEFAULT_VALHALLA_URL;
}

// Geometry does not change between refreshes of a screen, so it is fetched once
// per origin/destination/mode. Without this the routes screen's 20-second
// refresh would re-ask the router five times a minute.
// Successes and definitive "no path" answers only — a timeout must not
// permanently downgrade this pair to a straight line.
const pathCache = new Map<string, RoutedPath | null>();

function pathKey(from: LatLng, to: LatLng, costing: Costing): string {
  return `${costing}|${from.lat.toFixed(5)},${from.lng.toFixed(5)}|${to.lat.toFixed(
    5
  )},${to.lng.toFixed(5)}`;
}

/**
 * The walking or cycling path between two points, or null if the router cannot
 * be reached. Callers treat null as "fall back to a straight line" rather than
 * as an error worth showing.
 */
export async function routePath(
  from: LatLng,
  to: LatLng,
  costing: Costing,
  options?: { signal?: AbortSignal }
): Promise<RoutedPath | null> {
  const key = pathKey(from, to, costing);
  const cached = pathCache.get(key);
  if (cached !== undefined) return cached;

  // The demo server can hang; without a deadline the routes screen would sit
  // on its spinner rather than falling back.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => timeout.abort();
  options?.signal?.addEventListener("abort", onOuterAbort);

  try {
    const res = await fetch(`${baseUrl()}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timeout.signal,
      body: JSON.stringify({
        locations: [
          { lat: from.lat, lon: from.lng },
          { lat: to.lat, lon: to.lng }
        ],
        costing,
        directions_options: { units: "kilometers" }
      })
    });
    // Transient — not cached, so a later refresh can retry.
    if (!res.ok) return null;

    const body = (await res.json()) as {
      trip?: {
        summary?: { length?: number; time?: number };
        legs?: { shape?: string }[];
      };
    };

    const leg = body.trip?.legs?.[0];
    // Definitive: the router answered and has no path between these points.
    if (!leg?.shape) {
      pathCache.set(key, null);
      return null;
    }

    const path: RoutedPath = {
      points: decodePolyline(leg.shape, VALHALLA_POLYLINE_PRECISION),
      // `length` is in the requested units — kilometres.
      meters: Math.round((body.trip?.summary?.length ?? 0) * 1000),
      seconds: Math.round(body.trip?.summary?.time ?? 0)
    };
    pathCache.set(key, path);
    return path;
  } catch {
    // Offline, timed out, or the demo server refused us. Straight lines still
    // draw, so this is a downgrade rather than a failure.
    return null;
  } finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener("abort", onOuterAbort);
  }
}
