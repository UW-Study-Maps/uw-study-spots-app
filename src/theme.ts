/**
 * Design tokens from the Study Spots canvas design.
 *
 * The palette is warm and paper-like rather than the flat white of the
 * website — `bg` is the app ground, `panel` the inset blocks inside cards,
 * and `surface` the cards themselves.
 */
export const colors = {
  // Grounds
  bg: "#FBF8F2",
  surface: "#FFFFFF",
  panel: "#F3EDE0",
  border: "#E6DFD1",

  // Text
  ink: "#1D1A17",
  muted: "#5B564F",
  faint: "#8C867C",

  // Brand
  uwRed: "#C5050C",
  uwRedDeep: "#9B0000",
  uwRedTint: "#FDEBEA",

  // Status + category accents
  green: "#4C8C5B",
  amber: "#E0A82E",
  orange: "#C97A3D",
  blue: "#3D6C8A",
  brown: "#6B4226",

  // Map surfaces
  mapLand: "#EDE7DA",
  mapWater: "#D3DBDC",
  mapPark: "#E2E7DC",
  navInk: "#1D1A17",
  navLand: "#2A2622",
  navPark: "#33403F",

  // Misc fills
  stone: "#B9B0A0",
  barIdle: "#C9C0AE",
  disabled: "#D8CFBE"
};

/**
 * Font families as registered by `useAppFonts` in src/lib/fonts.ts.
 * Fraunces carries headings; Inter carries everything else.
 */
export const fonts = {
  displayS: "Fraunces_600SemiBold",
  displayB: "Fraunces_700Bold",
  body: "Inter_400Regular",
  medium: "Inter_500Medium",
  semi: "Inter_600SemiBold",
  bold: "Inter_700Bold"
};

/** Uppercase micro-labels ("HOW BUSY IS IT RIGHT NOW?") used throughout. */
export const overline = {
  fontFamily: fonts.bold,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase" as const,
  color: colors.faint
};
