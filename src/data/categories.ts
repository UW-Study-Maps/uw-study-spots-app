import type { Category, CategoryMeta } from "@/types/spot";

// Colors are ported from the website's data.js (CATEGORY_META) so the app
// matches the existing map's look. Icon names are Ionicons, not the
// FontAwesome classes the website uses.
export const CATEGORY_META: Record<Category, CategoryMeta & { icon: string }> = {
  Library: { color: "#C5050C", icon: "book", label: "Library" },
  "Student Union": { color: "#E0A82E", icon: "people", label: "Student Union" },
  "Academic Building": { color: "#3D6C8A", icon: "business", label: "Academic Building" },
  Outdoor: { color: "#4C8C5B", icon: "leaf", label: "Outdoor" },
  "Dining Hall": { color: "#C97A3D", icon: "restaurant", label: "Dining Hall" },
  "Coffee Shop": { color: "#6B4226", icon: "cafe", label: "Coffee Shop" }
};

// Curated filter chips (subset of all tags, chosen for usefulness) — kept in
// sync with the website's FILTER_TAGS.
export const FILTER_TAGS = [
  "Quiet",
  "Chill",
  "Social",
  "Lively",
  "University",
  "Off-Campus",
  "Group-Friendly",
  "Solo-Friendly",
  "Food & Coffee",
  "Late Hours",
  "Lake View",
  "Hidden Gem"
];
