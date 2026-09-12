import type { Spot } from "@/types/spot";

/**
 * Every study spot from the uw-study-spots-map website (see that repo's
 * data.js), kept in sync with it.
 *
 * The first twelve are the original spots from the Study Spots design. Their
 * copy (name, description, tags, noise/outlets) is the design's. Coordinates
 * are NOT — the design positions pins as percentages on a stylized map, which
 * is no use for real directions or transit lookups, so every spot was
 * geocoded against OpenStreetMap. The one exception is noted inline below.
 *
 * The rest were ported straight from the website's (already-geocoded)
 * data.js.
 *
 * Walking times are not stored: they are computed from the user's live
 * position in src/lib/routes.ts. Busyness isn't stored here either — it comes
 * entirely from the live crowd-report backend (see src/api/studySpots.ts and
 * statusOf in useAppState), which reports "no recent reports" for a spot
 * nobody has checked in at rather than a fabricated seed value.
 */
export const SPOTS: Spot[] = [
  {
    id: "college-library",
    name: "College Library",
    cat: "Library",
    address: "600 N Park St, Madison, WI 53706",
    lat: 43.076685,
    lng: -89.401313,
    noise: "Moderate hum",
    outlets: "Outlets at most seats",
    tags: ["University", "Social", "Group-Friendly", "Late Hours", "Food & Coffee"],
    desc: "The busiest library on campus and a favorite for undergrads — open late into the night with a mix of group rooms, comfy chairs, and quiet floors depending on what mode you're in."
  },
  {
    id: "memorial-library",
    name: "Memorial Library",
    cat: "Library",
    address: "728 State St, Madison, WI 53706",
    lat: 43.075027,
    lng: -89.399918,
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
    noise: "Silent",
    outlets: "Few outlets",
    tags: ["University", "Quiet", "Solo-Friendly", "Hidden Gem"],
    desc: "A quiet, plush reading room on the Union's second floor — genuinely silent, with generous seating that rarely fills up."
  },
  {
    id: "memorial-union-terrace",
    name: "Memorial Union Terrace",
    cat: "Outdoor",
    address: "800 Langdon St, Madison, WI 53706",
    lat: 43.076734,
    lng: -89.399652,
    noise: "Lively",
    outlets: "Few outlets",
    tags: ["University", "Social", "Lake View", "Food & Coffee"],
    desc: "Campus's most iconic spot, period — sunburst chairs, brats, live music, and a straight-on view of Lake Mendota."
  },
  {
    id: "prairie-fire-lounge",
    name: "Prairie Fire Lounge",
    cat: "Student Union",
    address: "1308 W Dayton St, Madison, WI 53715",
    lat: 43.07183,
    lng: -89.408108,
    noise: "Quiet",
    outlets: "Outlets at most seats",
    tags: ["University", "Quiet", "Chill", "Food & Coffee"],
    desc: "A quiet study lounge with soft music and nature-inspired décor — Union South's answer to a calm study room, with coffee and tapas close by."
  },
  {
    id: "wid",
    name: "Wisconsin Institute for Discovery",
    cat: "Academic Building",
    address: "330 N Orchard St, Madison, WI 53715",
    lat: 43.072818,
    lng: -89.408067,
    noise: "Moderate hum",
    outlets: "Outlets at most seats",
    tags: ["University", "Chill", "Group-Friendly", "Hidden Gem"],
    desc: "An airy, glass-walled atrium built for interdisciplinary collaboration — modern furniture, tall ceilings, and a research-hub energy."
  },
  {
    id: "chemistry-upper-floors",
    name: "Chemistry — 8th Floor",
    cat: "Academic Building",
    address: "1101 University Ave, Madison, WI 53706",
    lat: 43.072717,
    lng: -89.404565,
    noise: "Quiet",
    outlets: "Some outlets",
    tags: ["University", "Quiet", "Hidden Gem", "Solo-Friendly"],
    desc: "High-floor window seating with some of the best campus views around — students rate the 8th floor as the slightly better of the two."
  },
  {
    id: "babcock-dairy-store",
    name: "Babcock Dairy Store",
    cat: "Coffee Shop",
    address: "1605 Linden Dr, Madison, WI 53706",
    lat: 43.074792,
    lng: -89.413673,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Hidden Gem", "Food & Coffee"],
    desc: "A low-key café inside UW's own dairy plant near the Bakke Rec Center — better known for ice cream, but a genuinely quiet, off-the-radar coffee break."
  },
  {
    id: "colectivo-state",
    name: "Colectivo Coffee — State St",
    cat: "Coffee Shop",
    address: "583 State St, Madison, WI 53703",
    lat: 43.074668,
    lng: -89.395589,
    noise: "Lively",
    outlets: "Few outlets",
    tags: ["Off-Campus", "Social", "Food & Coffee"],
    desc: "A colorful, buzzing café a short walk from campus with strong espresso and enough space to camp out for a few hours."
  },
  {
    id: "gordon-dining",
    name: "Gordon Dining & Event Center",
    cat: "Dining Hall",
    address: "770 W Dayton St, Madison, WI 53715",
    lat: 43.071152,
    lng: -89.39838,
    noise: "Lively",
    outlets: "Some outlets",
    tags: ["University", "Social", "Food & Coffee", "Late Hours"],
    desc: "A dining hall with generous open seating on the upper floors — a favorite for students who like to study with food always in reach."
  },
  {
    id: "steenbock-library",
    name: "Steenbock Library",
    cat: "Library",
    address: "550 Babcock Dr, Madison, WI 53706",
    lat: 43.076104,
    lng: -89.413372,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem", "Solo-Friendly"],
    desc: "Tucked into the Ag campus near the dairy plant, Steenbock serves life-sciences students but welcomes anyone chasing a quiet table without the College Library crowds."
  },
  {
    id: "wendt-library",
    name: "Wendt Commons Library",
    cat: "Library",
    address: "215 N Randall Ave, Madison, WI 53706",
    lat: 43.071509,
    lng: -89.408633,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Group-Friendly", "Late Hours"],
    desc: "The engineering library and study commons — bright, modern, and stocked with computer labs and free printing, popular with STEM students grinding through problem sets."
  },
  {
    id: "merit-library",
    name: "MERIT Library",
    cat: "Library",
    address: "225 N Mills St, Madison, WI 53706",
    lat: 43.071285,
    lng: -89.403612,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Hidden Gem"],
    desc: "The School of Education's library, known for bean bag chairs and a laid-back, low-traffic vibe that's great for an easy afternoon of reading."
  },
  {
    id: "kohler-art-library",
    name: "Kohler Art Library",
    cat: "Library",
    address: "800 University Ave, Madison, WI 53706",
    lat: 43.073964,
    lng: -89.399423,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem"],
    desc: "A calm, art-focused collection inside the Chazen Museum complex — great light, gallery-adjacent quiet, and rarely crowded."
  },
  {
    id: "ebling-library",
    name: "Ebling Library",
    cat: "Library",
    address: "750 Highland Ave, Madison, WI 53705",
    lat: 43.07775,
    lng: -89.429789,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Late Hours", "Group-Friendly"],
    desc: "The library for med, pharmacy, and nursing students out on the health sciences campus — modern facilities and long hours during exam season."
  },
  {
    id: "robinson-map-library",
    name: "Robinson Map Library",
    cat: "Library",
    address: "550 N Park St, Madison, WI 53706",
    lat: 43.07588,
    lng: -89.401061,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem", "Solo-Friendly"],
    desc: "A small, quaint collection inside historic Science Hall — a genuinely quiet, out-of-the-way corner of campus that few students know about."
  },
  {
    id: "limnology-library",
    name: "Limnology Library",
    cat: "Library",
    address: "680 N Park St, Madison, WI 53706",
    lat: 43.077257,
    lng: -89.402966,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem", "Solo-Friendly", "Lake View"],
    desc: "A tiny specialized library near the lake that's almost always empty — as close to guaranteed silence as campus gets."
  },
  {
    id: "social-work-library",
    name: "Social Work Library",
    cat: "Library",
    address: "1350 University Ave, Madison, WI 53706",
    lat: 43.074204,
    lng: -89.408208,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill"],
    desc: "A welcoming, inclusive space with plenty of computers and printing — smaller and calmer than the big central libraries."
  },
  {
    id: "journalism-reading-room",
    name: "Journalism Reading Room",
    cat: "Library",
    address: "821 University Ave, Madison, WI 53706",
    lat: 43.072674,
    lng: -89.399822,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet"],
    desc: "A bright reading room with newer Mac workstations, tucked inside the Communication Arts building near Park Street."
  },
  {
    id: "lakefront-lounge",
    name: "Lakefront Lounge",
    cat: "Student Union",
    address: "800 Langdon St, Madison, WI 53706",
    lat: 43.07652,
    lng: -89.4003,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Lake View", "Food & Coffee"],
    desc: "A recently renovated lounge with big lake-facing windows, built for collaborative work and easy conversation over coffee."
  },
  {
    id: "shannon-sunset-lounge",
    name: "Shannon Sunset Lounge",
    cat: "Student Union",
    address: "800 Langdon St, Madison, WI 53706",
    lat: 43.07652,
    lng: -89.4003,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Lake View", "Hidden Gem"],
    desc: "Cozy armchairs, a fireplace, and near-panoramic lake views make this one of the Union's most relaxing corners for slow reading."
  },
  {
    id: "the-sett",
    name: "The Sett & Sett Balcony",
    cat: "Student Union",
    address: "1308 W Dayton St, Madison, WI 53715",
    lat: 43.072211,
    lng: -89.408637,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Lively", "Group-Friendly", "Food & Coffee"],
    desc: "A lively food-hall-style space with a second-floor balcony that has outlets and charging ports — good for group work when you want food within reach."
  },
  {
    id: "cs-6th-floor",
    name: "Computer Sciences 6th Floor Lounge",
    cat: "Academic Building",
    address: "1210 W Dayton St, Madison, WI 53706",
    lat: 43.071559,
    lng: -89.406707,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem"],
    desc: "A low-key top-floor lounge with a surprisingly pleasant vibe — a solid, under-the-radar spot away from the busier lower floors."
  },
  {
    id: "cs-patio",
    name: "Computer Sciences Patio",
    cat: "Outdoor",
    address: "1210 W Dayton St, Madison, WI 53706",
    lat: 43.071559,
    lng: -89.406707,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Hidden Gem"],
    desc: "A tiered outdoor patio with multiple seating levels — a solid pick for a laptop session on a warm afternoon between CS classes."
  },
  {
    id: "education-5th-floor",
    name: "Education Building — 5th Floor",
    cat: "Academic Building",
    address: "1000 Observatory Dr, Madison, WI 53706",
    lat: 43.07584,
    lng: -89.402291,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Chill", "Hidden Gem"],
    desc: "Standing desks and modern study pods give this floor a startup-office feel — modern, uncrowded, and easy to find a spot."
  },
  {
    id: "biochem-301",
    name: "Biochemistry Room 301",
    cat: "Academic Building",
    address: "433 Babcock Dr, Madison, WI 53706",
    lat: 43.074137,
    lng: -89.412024,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Group-Friendly", "Hidden Gem"],
    desc: "Configurable breakout rooms make this a solid pick for small group study sessions on the Ag-campus side of things."
  },
  {
    id: "biochem-kitchen",
    name: "Biochemistry 4th Floor Kitchen",
    cat: "Academic Building",
    address: "433 Babcock Dr, Madison, WI 53706",
    lat: 43.074137,
    lng: -89.412024,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Lively"],
    desc: "A social, kitchen-adjacent lounge with good views — livelier than most academic-building spots, good for a study break with friends."
  },
  {
    id: "soils-258",
    name: "Soils Building, Room 258",
    cat: "Academic Building",
    address: "1525 Observatory Dr, Madison, WI 53706",
    lat: 43.076476,
    lng: -89.411294,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Hidden Gem"],
    desc: "A genuinely cute room lined with plants and bookshelves — one of the more charming, least-known corners of the Ag campus."
  },
  {
    id: "badger-market",
    name: "Microbial Sciences Badger Market",
    cat: "Academic Building",
    address: "1550 Linden Dr, Madison, WI 53706",
    lat: 43.075872,
    lng: -89.412266,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Food & Coffee"],
    desc: "Open café-style seating with food service on hand, making it an easy stop for anyone studying on the west side of the Ag campus."
  },
  {
    id: "engineering-computer-labs",
    name: "Engineering Hall Computer Labs",
    cat: "Academic Building",
    address: "1415 Engineering Dr, Madison, WI 53706",
    lat: 43.071766,
    lng: -89.410288,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Group-Friendly"],
    desc: "Well-equipped computer labs with free printing — a dependable, no-frills option for engineering students needing lab software."
  },
  {
    id: "university-club",
    name: "University Club",
    cat: "Student Union",
    address: "803 State St, Madison, WI 53706",
    lat: 43.074856,
    lng: -89.399809,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Chill", "Social", "Hidden Gem"],
    desc: "A two-floor space with games alongside study seating — an easygoing option right at the base of Bascom Hill."
  },
  {
    id: "geo-sciences-picnic",
    name: "Geological Sciences Picnic Tables",
    cat: "Outdoor",
    address: "1215 W Dayton St, Madison, WI 53706",
    lat: 43.070526,
    lng: -89.405939,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Hidden Gem"],
    desc: "Simple picnic tables outside Weeks Hall — unglamorous but pleasant on a nice day, and rarely busy."
  },
  {
    id: "energy-institute-patio",
    name: "Energy Institute Patio",
    cat: "Outdoor",
    address: "1552 University Ave, Madison, WI 53726",
    lat: 43.073735,
    lng: -89.414038,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Hidden Gem"],
    desc: "A sunny patio that turns into one of the best warm-weather hangouts on the engineering side of campus."
  },
  {
    id: "greenhouse-benches",
    name: "D.C. Smith Greenhouse Benches",
    cat: "Outdoor",
    address: "465 Babcock Dr, Madison, WI 53706",
    lat: 43.074806,
    lng: -89.412501,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Chill", "Hidden Gem"],
    desc: "Benches tucked next to the botany greenhouses — fresh air, plants, and about as peaceful as campus gets."
  },
  {
    id: "library-mall",
    name: "Library Mall",
    cat: "Outdoor",
    address: "State St & N Park St, Madison, WI 53703",
    lat: 43.07529,
    lng: -89.399068,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Social", "Lively", "Food & Coffee"],
    desc: "The plaza where State Street meets campus — food carts, people-watching, and enough energy to make studying feel social."
  },
  {
    id: "lakeshore-path",
    name: "Lakeshore Path / Class of 1918 Marsh",
    cat: "Outdoor",
    address: "Lakeshore Path, Madison, WI 53706",
    lat: 43.077108,
    lng: -89.400473,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["University", "Quiet", "Chill", "Lake View", "Hidden Gem"],
    desc: "A wooded, waterside trail a short walk from the Union — the closest thing to nature-immersion studying you'll find on campus."
  },
  {
    id: "michelangelos",
    name: "Michelangelo's Coffee House",
    cat: "Coffee Shop",
    address: "114 State St, Madison, WI 53703",
    lat: 43.074902,
    lng: -89.387222,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Social", "Late Hours", "Food & Coffee"],
    desc: "A State Street institution near the Capitol with an eclectic, artsy interior and a loyal late-night crowd."
  },
  {
    id: "fair-trade",
    name: "Fair Trade Coffee House",
    cat: "Coffee Shop",
    address: "418 State St, Madison, WI 53703",
    lat: 43.074994,
    lng: -89.392048,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Chill", "Food & Coffee"],
    desc: "A cozy, community-minded café on State Street known for good sandwiches and bakery items alongside its coffee."
  },
  {
    id: "indie-coffee",
    name: "Indie Coffee",
    cat: "Coffee Shop",
    address: "1225 Regent St, Madison, WI 53715",
    lat: 43.067566,
    lng: -89.406563,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Chill", "Food & Coffee"],
    desc: "A neighborhood coffee shop near Camp Randall with a relaxed, local feel — a nice break from the campus-core crowds."
  },
  {
    id: "evp-coffee",
    name: "EVP Coffee — University Row",
    cat: "Coffee Shop",
    address: "741 University Row, Madison, WI 53705",
    lat: 43.076138,
    lng: -89.469167,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Chill", "Food & Coffee"],
    desc: "A spacious west-campus coffee shop with plenty of tables, popular with grad students and staff from nearby research buildings."
  },
  {
    id: "barriques-monroe",
    name: "Barriques — Monroe Street",
    cat: "Coffee Shop",
    address: "1825 Monroe St, Madison, WI 53711",
    lat: 43.064948,
    lng: -89.416601,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Social", "Food & Coffee"],
    desc: "A wine-shop-meets-café in the Monroe Street neighborhood, with a full breakfast and lunch menu and a warm, neighborhood feel."
  },
  {
    id: "upper-house",
    name: "Upper House",
    cat: "Student Union",
    address: "365 East Campus Mall, Madison, WI 53715",
    lat: 43.072793,
    lng: -89.398925,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Quiet", "Chill", "Group-Friendly", "Hidden Gem", "Food & Coffee"],
    desc: "A strikingly designed lounge right on East Campus Mall — circular tables, booths, and reservable private study rooms, run by a Christian study center but open to all students. Open weekdays 9am–5pm only, so plan around it."
  },
  {
    id: "historical-society-library",
    name: "Wisconsin Historical Society Library",
    cat: "Library",
    address: "816 State St, Madison, WI 53706",
    lat: 43.075405,
    lng: -89.400069,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Quiet", "Hidden Gem", "Solo-Friendly"],
    desc: "A serious, no-talking research library right next door to Memorial Library — marble halls and an almost reverent hush make it one of the strictest quiet spaces near campus."
  },
  {
    id: "st-francis-house",
    name: "St. Francis House",
    cat: "Student Union",
    address: "1011 University Ave, Madison, WI 53715",
    lat: 43.073221,
    lng: -89.402702,
    noise: "Unknown",
    outlets: "Unknown",
    tags: ["Off-Campus", "Quiet", "Chill", "Hidden Gem"],
    desc: "An Episcopal student center on University Avenue with a dedicated study room — big tables, leather chairs, and soft background music, open to students of any faith or none."
  }
];

/**
 * Stand-in origin for when the device will not give us a position — permission
 * refused, location services off, or no fix yet. Union South is the middle of
 * campus and is where the design framed every route from.
 */
export const FALLBACK_ORIGIN = { lat: 43.07183, lng: -89.408108, label: "Union South" };
