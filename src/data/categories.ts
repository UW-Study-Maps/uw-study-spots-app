import type { Category, CategoryMeta, CrowdLevel, StatusKey, StatusMeta } from "@/types/spot";
import { colors } from "@/theme";

/** Category accent colors and Ionicons, per the design's CAT map. */
export const CAT: Record<Category, CategoryMeta> = {
  Library: { color: colors.uwRed, icon: "book" },
  "Student Union": { color: colors.amber, icon: "people" },
  "Academic Building": { color: colors.blue, icon: "business" },
  Outdoor: { color: colors.green, icon: "leaf" },
  "Dining Hall": { color: colors.orange, icon: "restaurant" },
  "Coffee Shop": { color: colors.brown, icon: "cafe" }
};

/** Crowding levels, plus the `none` placeholder for spots with no reports. */
export const ST: Record<StatusKey, StatusMeta> = {
  empty: { label: "Empty", color: colors.green, n: 0 },
  some: { label: "Some seats", color: colors.amber, n: 1 },
  busy: { label: "Busy", color: colors.orange, n: 2 },
  full: { label: "Full", color: colors.uwRed, n: 3 },
  none: { label: "No recent reports", color: colors.faint, n: -1 }
};

/** Index order of the `votes` tuple and of the report picker. */
export const CROWD_ORDER: CrowdLevel[] = ["empty", "some", "busy", "full"];

/** Ionicons for each crowding option in the report sheet. */
export const CROWD_ICON: Record<CrowdLevel, string> = {
  empty: "square-outline",
  some: "person",
  busy: "people",
  full: "grid"
};

export const CATS: (Category | "All")[] = [
  "All",
  "Library",
  "Student Union",
  "Academic Building",
  "Outdoor",
  "Dining Hall",
  "Coffee Shop"
];

export const TAGS = [
  "Quiet",
  "Chill",
  "Social",
  "Lively",
  "Group-Friendly",
  "Solo-Friendly",
  "Food & Coffee",
  "Late Hours",
  "Hidden Gem",
  "Lake View"
];

export const NOISE_OPTS = ["Silent", "Moderate hum", "Lively"] as const;
export const OUTLET_OPTS = [
  "Few outlets",
  "Some outlets",
  "Outlets at most seats"
] as const;
