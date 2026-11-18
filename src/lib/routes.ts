import { routePath, type RoutedPath } from "@/api/routing";
import { fetchBusLegShape, findBusPlan, walkMinutes, type BusPlan } from "@/api/transit";
import { distanceMeters, type LatLng } from "@/lib/polyline";
import { colors } from "@/theme";
import type { RouteOption, RouteSegment, Spot } from "@/types/spot";

// Fallback speeds, used only for the instant estimate on list cards and when
// the router cannot be reached.
const WALK_SPEED_MPS = 1.35;
const BIKE_SPEED_MPS = 4.2;
// Streets are not straight lines; pad point-to-point distance before turning it
// into minutes.
const DETOUR_FACTOR = 1.3;

function clockTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function minutesFromNow(minutes: number): string {
  return clockTime(Math.floor(Date.now() / 1000) + minutes * 60);
}

function toLatLng(spot: Spot): LatLng {
  return { lat: spot.lat, lng: spot.lng };
}

/** A straight two-point segment, flagged so the UI knows it is not real geometry. */
function straight(from: LatLng, to: LatLng, kind: RouteSegment["kind"]): RouteSegment {
  return { points: [from, to], kind, isPrecise: false };
}

/** Router time when available, otherwise the walk implied by stop distance. */
function minutesOf(routed: RoutedPath | null, fallbackMeters: number): number {
  return routed ? Math.max(1, Math.round(routed.seconds / 60)) : walkMinutes(fallbackMeters);
}

/**
 * Rough minutes on foot, computed instantly from distance.
 *
 * This is what list cards and the detail sheet show, because routing every
 * visible card would mean a network call per row. The routes screen replaces it
 * with a real pedestrian route, so the two can differ by a couple of minutes —
 * which is why this value is always rendered with a leading "~".
 */
export function estimatedWalkMinutes(origin: LatLng, spot: Spot): number {
  const meters = distanceMeters(origin, toLatLng(spot)) * DETOUR_FACTOR;
  return Math.max(1, Math.round(meters / WALK_SPEED_MPS / 60));
}

export function walkLabel(origin: LatLng, spot: Spot): string {
  return `~${estimatedWalkMinutes(origin, spot)} min`;
}

/** Walking option — real pedestrian geometry where the router answers. */
async function walkOption(
  origin: LatLng,
  spot: Spot,
  signal?: AbortSignal
): Promise<RouteOption> {
  const dest = toLatLng(spot);
  const routed = await routePath(origin, dest, "pedestrian", { signal });
  const minutes = routed
    ? Math.max(1, Math.round(routed.seconds / 60))
    : estimatedWalkMinutes(origin, spot);

  return {
    key: "walk",
    icon: "walk",
    color: colors.green,
    time: `${minutes} min`,
    arrive: `arrive ${minutesFromNow(minutes)}`,
    summary: routed ? "Walking route" : "Walking, estimated from distance",
    tag: "Simplest",
    isPrecise: Boolean(routed),
    legs: [{ icon: "walk", text: `Walk to ${spot.name}`, dur: `${minutes} min` }],
    segments: [
      routed
        ? { points: routed.points, kind: "walk", isPrecise: true }
        : straight(origin, dest, "walk")
    ],
    nodes: [origin, dest]
  };
}

/** Bike option — real cycling geometry where the router answers. */
async function bikeOption(
  origin: LatLng,
  spot: Spot,
  signal?: AbortSignal
): Promise<RouteOption> {
  const dest = toLatLng(spot);
  const routed = await routePath(origin, dest, "bicycle", { signal });
  const rideMinutes = routed
    ? Math.max(1, Math.round(routed.seconds / 60))
    : Math.max(
        1,
        Math.round((distanceMeters(origin, dest) * DETOUR_FACTOR) / BIKE_SPEED_MPS / 60)
      );
  // Two minutes for undocking and docking at either end.
  const total = rideMinutes + 2;

  return {
    key: "bike",
    icon: "bicycle",
    color: colors.blue,
    time: `${total} min`,
    arrive: `arrive ${minutesFromNow(total)}`,
    summary: routed ? "BCycle along the campus paths" : "BCycle, estimated from distance",
    tag: "",
    isPrecise: Boolean(routed),
    legs: [
      { icon: "walk", text: "Undock a BCycle", dur: "1 min" },
      { icon: "bicycle", text: `Ride to ${spot.name}`, dur: `${rideMinutes} min` },
      { icon: "walk", text: "Dock and walk in", dur: "1 min" }
    ],
    segments: [
      routed
        ? { points: routed.points, kind: "ride", isPrecise: true }
        : straight(origin, dest, "ride")
    ],
    nodes: [origin, dest]
  };
}

/**
 * Bus option — the agency's own route shape for the ride, and real pedestrian
 * routes for the walks either side of it.
 */
async function busOption(
  plan: BusPlan,
  origin: LatLng,
  spot: Spot,
  signal?: AbortSignal
): Promise<RouteOption> {
  const dest = toLatLng(spot);
  const board: LatLng = { lat: plan.boardStopLat, lng: plan.boardStopLng };
  const alight: LatLng = { lat: plan.alightStopLat, lng: plan.alightStopLng };

  const [toStop, ride, fromStop] = await Promise.all([
    routePath(origin, board, "pedestrian", { signal }),
    fetchBusLegShape(plan, { signal }),
    routePath(alight, dest, "pedestrian", { signal })
  ]);

  const now = Math.floor(Date.now() / 1000);
  const boardWalk = minutesOf(toStop, plan.boardWalkMeters);
  const alightWalk = minutesOf(fromStop, plan.alightWalkMeters);
  const waitMinutes = Math.max(0, Math.round((plan.departureTime - now) / 60));
  const rideMinutes = Math.max(1, Math.round((plan.arrivalTime - plan.departureTime) / 60));
  const total = boardWalk + waitMinutes + rideMinutes + alightWalk;
  const routeLabel = plan.shortName || plan.longName;

  return {
    key: "bus",
    icon: "bus",
    color: plan.color,
    time: `${total} min`,
    arrive: `arrive ${clockTime(plan.arrivalTime + alightWalk * 60)}`,
    summary:
      waitMinutes <= 0
        ? `Route ${routeLabel} · departing now`
        : `Route ${routeLabel} · departs in ${waitMinutes} min`,
    tag: "",
    isLive: plan.isRealTime,
    isPrecise: Boolean(toStop && ride && fromStop),
    legs: [
      { icon: "walk", text: `Walk to ${plan.boardStopName}`, dur: `${boardWalk} min` },
      {
        icon: "bus",
        text: `Route ${routeLabel} · ${plan.headsign}`,
        dur: `${rideMinutes} min`
      },
      { icon: "walk", text: `Walk from ${plan.alightStopName}`, dur: `${alightWalk} min` }
    ],
    segments: [
      toStop
        ? { points: toStop.points, kind: "walk", isPrecise: true }
        : straight(origin, board, "walk"),
      ride ? { points: ride, kind: "ride", isPrecise: true } : straight(board, alight, "ride"),
      fromStop
        ? { points: fromStop.points, kind: "walk", isPrecise: true }
        : straight(alight, dest, "walk")
    ],
    nodes: [origin, board, alight, dest]
  };
}

export interface RoutePlan {
  options: RouteOption[];
  /** True when the bus option came from live Transit data. */
  hasBus: boolean;
}

/**
 * The travel options for a spot, from the user's current position.
 *
 * Walking and biking come from a street router; the bus leg is live Transit
 * data drawn on the agency's own route shape. The bus option is omitted when no
 * single bus connects the two points — better two honest options than an
 * invented third. Whichever is fastest gets the "Fastest" badge.
 */
export async function planRoutes(
  origin: LatLng,
  spot: Spot,
  options?: { signal?: AbortSignal }
): Promise<RoutePlan> {
  const signal = options?.signal;
  const plan = await findBusPlan(origin, toLatLng(spot), options).catch(() => null);

  const [walk, bike, bus] = await Promise.all([
    walkOption(origin, spot, signal),
    bikeOption(origin, spot, signal),
    plan ? busOption(plan, origin, spot, signal) : Promise.resolve(null)
  ]);

  const all = bus ? [walk, bus, bike] : [walk, bike];
  const parse = (option: RouteOption) => parseInt(option.time, 10);
  const fastest = all.reduce((a, b) => (parse(b) < parse(a) ? b : a));
  for (const option of all) {
    if (option === fastest) option.tag = "Fastest";
    else if (option.key !== "walk") option.tag = "";
  }

  return { options: all, hasBus: Boolean(bus) };
}
