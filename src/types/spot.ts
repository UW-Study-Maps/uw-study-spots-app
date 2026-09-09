export type Category =
  | "Library"
  | "Student Union"
  | "Academic Building"
  | "Outdoor"
  | "Dining Hall"
  | "Coffee Shop";

/** Crowding levels, ordered emptiest-first — `none` means nobody has reported. */
export type CrowdLevel = "empty" | "some" | "busy" | "full";
export type StatusKey = CrowdLevel | "none";

export type NoiseLevel = "Silent" | "Quiet" | "Moderate hum" | "Lively" | "Unknown";
export type OutletLevel =
  | "Few outlets"
  | "Some outlets"
  | "Outlets at most seats"
  | "Unknown";

export interface Spot {
  id: string;
  name: string;
  cat: Category;
  address: string;
  lat: number;
  lng: number;
  status: StatusKey;
  /** Human age of the newest report, e.g. "4 min ago"; empty when none. */
  age: string;
  /** Report tallies in CROWD_ORDER order: [empty, some, busy, full]. */
  votes: [number, number, number, number];
  noise: NoiseLevel;
  outlets: OutletLevel;
  tags: string[];
  desc: string;
}

export interface CategoryMeta {
  color: string;
  icon: string;
}

export interface StatusMeta {
  label: string;
  color: string;
  /** Index into the votes array; -1 for `none`. */
  n: number;
}

/** A crowd report the user has submitted this session. */
export interface SpotReport {
  crowd: CrowdLevel;
  noise: NoiseLevel | null;
  outlets: OutletLevel | null;
}

export type TravelMode = "walk" | "bus" | "bike";

export interface RouteLeg {
  icon: string;
  text: string;
  dur: string;
}

/** One drawn stretch of a route: a walk on foot, or a leg aboard a vehicle. */
export interface RouteSegment {
  /**
   * The path itself. Street geometry where a router or the agency's own route
   * shape could supply it, and a two-point straight line only as a fallback —
   * `isPrecise` says which.
   */
  points: { lat: number; lng: number }[];
  /** Walk segments render dotted and grey; ride segments solid in mode color. */
  kind: "walk" | "ride";
  /** False when this stretch fell back to a straight line. */
  isPrecise: boolean;
}

export interface RouteOption {
  key: TravelMode;
  icon: string;
  color: string;
  time: string;
  arrive: string;
  summary: string;
  /** "Fastest" / "Simplest" badge; empty for none. */
  tag: string;
  legs: RouteLeg[];
  /** Geometry for the map preview, in real coordinates. */
  segments: RouteSegment[];
  /** Points marked with a node on the preview — start, transfers, end. */
  nodes: { lat: number; lng: number }[];
  /** True when `summary`/`legs` came from live Transit data, not the fallback. */
  isLive?: boolean;
  /** True when every segment is real routed geometry, not a straight line. */
  isPrecise: boolean;
}
