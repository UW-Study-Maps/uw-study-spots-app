import { colors } from "@/theme";

/**
 * Default camera pitch, in degrees from straight down. **This is the knob to
 * turn for map tilt.**
 *
 * 0 is flat overhead; Google allows up to 45 and clamps toward 0 as you zoom
 * out, so a value this modest survives at campus zoom but will flatten if the
 * user pinches right out. Applied by `useMapTilt`.
 */
export const MAP_PITCH = 25;

/**
 * Google Maps style for the campus map — a transit-app style basemap: streets
 * and water, nothing else.
 *
 * Everything that competes with the spot pins is switched off: business and
 * park POIs, building footprints, transit stations, and terrain. What is left
 * is the road network, which Google already thins by zoom — motorways and
 * arterials when zoomed out, local streets as you go in — so no manual
 * per-zoom rules are needed.
 *
 * Colors are the design's own, so the real map reads like the drawn one it
 * replaces: warm paper ground, near-white roads, muted water.
 */
export const MAP_STYLE = [
  // Base ground and default label treatment.
  { elementType: "geometry", stylers: [{ color: colors.mapLand }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: colors.muted }] },
  { elementType: "labels.text.stroke", stylers: [{ color: colors.mapLand }] },

  // Points of interest: off entirely. Parks keep their fill as ground shape,
  // but lose their labels.
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: colors.mapPark }, { visibility: "on" }]
  },

  // Buildings and other man-made footprints — the main source of clutter at
  // campus zoom levels.
  { featureType: "landscape.man_made", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: colors.mapLand }]
  },

  // Roads: the one thing we do want. Local streets keep a hairline outline so
  // the grid still reads when zoomed out.
  { featureType: "road", elementType: "geometry", stylers: [{ color: colors.bg }] },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: colors.border }]
  },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: colors.surface }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: colors.surface }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: colors.stone }]
  },

  // Transit: the app draws its own bus line, so Google's would double it up.
  { featureType: "transit", stylers: [{ visibility: "off" }] },

  // Lake Mendota and the lakeshore.
  { featureType: "water", elementType: "geometry", stylers: [{ color: colors.mapWater }] },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: colors.faint }]
  },

  // Administrative boundaries add lines with no meaning at campus scale.
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "administrative.neighborhood",
    stylers: [{ visibility: "off" }]
  }
];

/**
 * The same basemap with every label removed — used for the small route
 * previews, where street names would be unreadable anyway.
 */
export const MAP_STYLE_PREVIEW = [
  ...MAP_STYLE,
  { elementType: "labels", stylers: [{ visibility: "off" }] }
];
