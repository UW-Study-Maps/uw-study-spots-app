import { estimatedWalkMinutes } from "@/lib/routes";
import type { LatLng } from "@/lib/polyline";
import type { Spot, StatusMeta } from "@/types/spot";

/** Busyness slider stops — index 0 is "no preference". */
export const BUSYNESS_STEPS = ["Any", "Empty", "Some seats", "Busy", "Full"] as const;

/** Transit-time slider stops — index 0 is "no preference". */
export const TRANSIT_STEPS = [
  "Anytime",
  "5 min",
  "10 min",
  "15 min",
  "20 min",
  "25 min",
  "30 min"
] as const;

/** Minutes ceiling for each TRANSIT_STEPS index; null means no ceiling. */
const TRANSIT_MAX_MINUTES: (number | null)[] = [null, 5, 10, 15, 20, 25, 30];

export interface RankedSpot {
  spot: Spot;
  score: number;
  walkMinutes: number;
}

/**
 * Rewards a spot for being at or under the accepted busyness ceiling (with a
 * small nudge toward emptier still), and falls off sharply past it. A spot
 * with no reports yet (`n === -1`) is scored as index 1 ("some") — a neutral
 * guess rather than assuming it's empty or full.
 */
function busynessScore(levelIndex: number, maxIndex: number | null): number {
  if (maxIndex === null) return 1;
  const level = levelIndex === -1 ? 1 : levelIndex;
  if (level <= maxIndex) return 1 - level * 0.08;
  const over = level - maxIndex;
  return Math.max(0, 0.55 - over * 0.35);
}

/** Same shape as busynessScore: reward under the ceiling, fall off past it. */
function transitScore(minutes: number, maxMinutes: number | null): number {
  if (maxMinutes === null) return Math.max(0.7, 1 - minutes / 150);
  if (minutes <= maxMinutes) return 1 - (minutes / maxMinutes) * 0.2;
  const over = minutes - maxMinutes;
  return Math.max(0, 0.6 - over * 0.05);
}

/**
 * Ranks every spot by how well it matches the busyness and transit-time
 * preferences, equally weighted, best first.
 *
 * Both sliders' "no preference" end (index 0) drops that dimension out of the
 * score entirely rather than penalizing anything, so a spot is never marked
 * down for a criterion the user said they don't care about. Ties fall back to
 * shorter walk time, then name, so results stay stable.
 */
export function rankSpots(
  spots: Spot[],
  origin: LatLng,
  statusOf: (spot: Spot) => StatusMeta,
  busynessStepIndex: number,
  transitStepIndex: number
): RankedSpot[] {
  const maxBusyIndex = busynessStepIndex === 0 ? null : busynessStepIndex - 1;
  const maxMinutes = TRANSIT_MAX_MINUTES[transitStepIndex] ?? null;

  return spots
    .map((spot) => {
      const walkMinutes = estimatedWalkMinutes(origin, spot);
      const bScore = busynessScore(statusOf(spot).n, maxBusyIndex);
      const tScore = transitScore(walkMinutes, maxMinutes);
      return { spot, walkMinutes, score: Math.round(((bScore + tScore) / 2) * 100) };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.walkMinutes - b.walkMinutes ||
        a.spot.name.localeCompare(b.spot.name)
    );
}
