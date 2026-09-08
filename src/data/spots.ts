import type { Spot } from "@/types/spot";

/**
 * The twelve spots from the Study Spots design.
 *
 * Copy (name, description, tags, noise/outlets, crowding seeds) is the
 * design's. Coordinates are NOT — the design positions pins as percentages on
 * a stylized map, which is no use for real directions or transit lookups, so
 * every spot was geocoded against OpenStreetMap. The one exception is noted
 * inline below.
 *
 * Walking times are not stored: they are computed from the user's live
 * position in src/lib/routes.ts.
 *
 * `status`/`age`/`votes` are seed values standing in for the crowd-report
 * backend; a report made in-app overrides them for the session (see
 * useSpotReports).
 */
export const SPOTS: Spot[] = [
  {
    id: "college-library",
    name: "College Library",
    cat: "Library",
    address: "600 N Park St, Madison, WI 53706",
    lat: 43.076685,
    lng: -89.401313,
    status: "full",
    age: "4 min ago",
    votes: [1, 2, 4, 9],
    noise: "Moderate hum",
    outlets: "Outlets at most seats",
    tags: ["University", "Social", "Group-Friendly", "Late Hours"],
    desc: "The busiest library on campus and a favorite for undergrads — open late into the night with a mix of group rooms, comfy chairs, and quiet floors depending on what mode you're in."
  },
  {
    id: "memorial-library",
    name: "Memorial Library",
    cat: "Library",
    address: "728 State St, Madison, WI 53706",
    lat: 43.075027,
    lng: -89.399918,
    status: "some",
    age: "11 min ago",
    votes: [2, 6, 3, 1],
    noise: "Silent",
    outlets: "Some outlets",
    tags: ["University", "Quiet", "Solo-Friendly"],
    desc: "UW's main research library — tall stacks, individual carrels, and a serious, hushed atmosphere that's ideal when you actually need to focus."
  },
  {
    id: "law-library",
    name: "Law Library Reading Room",
    cat: "Library",
    // The design's mock address ("975 Lathrop Dr") points somewhere else on
    // campus; corrected to the Law Building's real one. These coordinates are
    // the one approximation here — OpenStreetMap has no entry for the
    // building, so verify before shipping directions to this spot.
    address: "975 Bascom Mall, Madison, WI 53706",
    lat: 43.075,
    lng: -89.4026,
    status: "empty",
    age: "2 min ago",
    votes: [7, 2, 0, 0],
    noise: "Silent",
    outlets: "Some outlets",
    tags: ["University", "Quiet", "Hidden Gem", "Solo-Friendly"],
    desc: "A grand, wood-paneled reading room that feels more like a private study hall than a law library — one of campus's most underrated quiet spots."
  },
  {
    id: "business-library",
    name: "Business Library",
    cat: "Library",
    address: "975 University Ave, Madison, WI 53706",
    lat: 43.072695,
    lng: -89.401563,
    status: "some",
    age: "18 min ago",
    votes: [1, 5, 3, 2],
    noise: "Moderate hum",
    outlets: "Outlets at most seats",
    tags: ["University", "Chill", "Group-Friendly"],
    desc: "Sleek and modern — regularly cited by students as the nicest library on campus, with plenty of natural light and comfortable seating throughout Grainger Hall."
  },
  {
    id: "hamel-browsing-library",
    name: "Hamel Family Browsing Library",
    cat: "Student Union",
    address: "800 Langdon St, Madison, WI 53706",
    lat: 43.07652,
    lng: -89.4003,
    status: "empty",
    age: "9 min ago",
    votes: [6, 3, 1, 0],
    noise: "Silent",
    outlets: "Few outlets",
    tags: ["University", "Quiet", "Hidden Gem"],
    desc: "A quiet, plush reading room on the Union's second floor — genuinely silent, with generous seating that rarely fills up."
  },
  {
    id: "memorial-union-terrace",
    name: "Memorial Union Terrace",
    cat: "Outdoor",
    address: "800 Langdon St, Madison, WI 53706",
    lat: 43.076734,
    lng: -89.399652,
    status: "busy",
    age: "6 min ago",
    votes: [0, 2, 7, 3],
    noise: "Lively",
    outlets: "Few outlets",
    tags: ["University", "Social", "Lake View"],
    desc: "Campus's most iconic spot, period — sunburst chairs, brats, live music, and a straight-on view of Lake Mendota."
  },
  {
    id: "prairie-fire-lounge",
    name: "Prairie Fire Lounge",
    cat: "Student Union",
    address: "1308 W Dayton St, Madison, WI 53715",
    lat: 43.07183,
    lng: -89.408108,
    status: "some",
    age: "22 min ago",
    votes: [2, 6, 2, 0],
    noise: "Quiet",
    outlets: "Outlets at most seats",
    tags: ["University", "Quiet", "Chill"],
    desc: "A quiet study lounge with soft music and nature-inspired décor — Union South's answer to a calm study room, with coffee and tapas close by."
  },
  {
    id: "wid",
    name: "Wisconsin Institute for Discovery",
    cat: "Academic Building",
    address: "330 N Orchard St, Madison, WI 53715",
    lat: 43.072818,
    lng: -89.408067,
    status: "some",
    age: "15 min ago",
    votes: [1, 7, 2, 1],
    noise: "Moderate hum",
    outlets: "Outlets at most seats",
    tags: ["University", "Chill", "Group-Friendly"],
    desc: "An airy, glass-walled atrium built for interdisciplinary collaboration — modern furniture, tall ceilings, and a research-hub energy."
  },
  {
    id: "chemistry-upper-floors",
    name: "Chemistry — 8th Floor",
    cat: "Academic Building",
    address: "1101 University Ave, Madison, WI 53706",
    lat: 43.072717,
    lng: -89.404565,
    status: "empty",
    age: "31 min ago",
    votes: [5, 1, 0, 0],
    noise: "Quiet",
    outlets: "Some outlets",
    tags: ["University", "Quiet", "Hidden Gem"],
    desc: "High-floor window seating with some of the best campus views around — students rate the 8th floor as the slightly better of the two."
  },
  {
    id: "babcock-dairy-store",
    name: "Babcock Dairy Store",
    cat: "Coffee Shop",
    address: "1605 Linden Dr, Madison, WI 53706",
    lat: 43.074792,
    lng: -89.413673,
    status: "none",
    age: "",
    votes: [0, 0, 0, 0],
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Hidden Gem"],
    desc: "A low-key café inside UW's own dairy plant near the Bakke Rec Center — better known for ice cream, but a genuinely quiet, off-the-radar coffee break."
  },
  {
    id: "colectivo-state",
    name: "Colectivo Coffee — State St",
    cat: "Coffee Shop",
    address: "583 State St, Madison, WI 53703",
    lat: 43.074668,
    lng: -89.395589,
    status: "busy",
    age: "7 min ago",
    votes: [0, 3, 6, 2],
    noise: "Lively",
    outlets: "Few outlets",
    tags: ["Off-Campus", "Social"],
    desc: "A colorful, buzzing café a short walk from campus with strong espresso and enough space to camp out for a few hours."
  },
  {
    id: "gordon-dining",
    name: "Gordon Dining & Event Center",
    cat: "Dining Hall",
    address: "770 W Dayton St, Madison, WI 53715",
    lat: 43.071152,
    lng: -89.39838,
    status: "full",
    age: "3 min ago",
    votes: [0, 1, 3, 8],
    noise: "Lively",
    outlets: "Some outlets",
    tags: ["University", "Social", "Late Hours"],
    desc: "A dining hall with generous open seating on the upper floors — a favorite for students who like to study with food always in reach."
  }
];

/**
 * Stand-in origin for when the device will not give us a position — permission
 * refused, location services off, or no fix yet. Union South is the middle of
 * campus and is where the design framed every route from.
 */
export const FALLBACK_ORIGIN = { lat: 43.07183, lng: -89.408108, label: "Union South" };

export function getSpot(id: string | undefined): Spot | undefined {
  return SPOTS.find((s) => s.id === id);
}
