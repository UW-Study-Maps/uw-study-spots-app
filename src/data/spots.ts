import type { Spot } from "@/types/spot";

// Placeholder data so the list/map screens render something during
// development. The real dataset lives in the website repo's data.js and
// isn't served over an API yet — before shipping, either:
//   1. add a GET /api/spots endpoint to the Cloudflare Functions backend
//      that returns STUDY_SPOTS from data.js, or
//   2. extract data.js into a shared package both repos import.
// Whichever it is, replace this file with a fetch against that source.
export const STUDY_SPOTS: Spot[] = [
  {
    id: "college-library",
    name: "College Library",
    category: "Library",
    affiliation: "University",
    address: "600 N Park St, Madison, WI 53706",
    lat: 43.076685,
    lng: -89.401313,
    description:
      "The busiest library on campus and a favorite for undergrads — open late into the night with a mix of group rooms, comfy chairs, and quiet floors depending on what mode you're in.",
    tags: ["University", "Library", "Social", "Group-Friendly", "Late Hours", "Food & Coffee"]
  },
  {
    id: "memorial-library",
    name: "Memorial Library",
    category: "Library",
    affiliation: "University",
    address: "728 State St, Madison, WI 53706",
    lat: 43.075027,
    lng: -89.399918,
    description:
      "UW's main research library — tall stacks, individual carrels, and a serious, hushed atmosphere that's ideal when you actually need to focus.",
    tags: ["University", "Library", "Quiet", "Solo-Friendly"]
  },
  {
    id: "steenbock-library",
    name: "Steenbock Library",
    category: "Library",
    affiliation: "University",
    address: "550 Babcock Dr, Madison, WI 53706",
    lat: 43.076104,
    lng: -89.413372,
    description:
      "Tucked into the Ag campus near the dairy plant, Steenbock serves life-sciences students but welcomes anyone chasing a quiet table without the College Library crowds.",
    tags: ["University", "Library", "Quiet", "Hidden Gem", "Solo-Friendly"]
  }
];
