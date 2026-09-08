# UW Study Spots — App

Mobile companion app for [uw-study-spots-map](https://github.com/Awonder9/uw-study-spots-map),
built with [Expo](https://expo.dev) (React Native + TypeScript + Expo Router).

Implements the **Study Spots App** Claude Design canvas: onboarding, a map/list
home, spot detail sheet, route options, turn-by-turn navigation, and crowd
reporting. Bus routing is live, via Transit's public API.

## Stack

- Expo SDK 57 / React Native 0.86
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation, in `app/`)
- `react-native-maps` (Google provider) for the basemap, pins and route lines
- `expo-location` for the device position routes are planned from
- Fraunces + Inter via `@expo-google-fonts`, loaded with `expo-font`
- `@react-native-async-storage/async-storage` for saved spots and the onboarding flag

## Getting started

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run start
```

Fill in `.env.local` — a Transit API key and a Google Maps key at minimum — then
press `i` / `a`, or scan the QR code with Expo Go. `npm run typecheck` runs
`tsc --noEmit`.

>
> `PROVIDER_GOOGLE` on iOS needs the native Google Maps SDK, which Expo Go does
> not bundle: iOS in Expo Go falls back to Apple Maps and ignores
> `customMapStyle`, so the basemap will not look right there. Android in Expo Go
> is fine. For the styled map on iOS, build a dev client
> (`npx expo run:ios`, or `npx eas build --profile development`).

## Project structure

```
app/                    Expo Router routes (screens)
  (tabs)/
    index.tsx           Home — map + list, search, category and tag filters
    saved.tsx           Saved spots
  spot/[id].tsx         Spot detail sheet
  routes/[id].tsx       Route options — walk / bus / bike
  nav/[id].tsx          Turn-by-turn navigation
  report/[id].tsx       Crowd report sheet
  _layout.tsx           Font loading, onboarding gate, root stack

The spot and report sheets are `transparentModal` screens, so the screen that
opened them stays mounted and visible underneath. That needs an explicit
`contentStyle: { backgroundColor: "transparent" }` per screen — the stack's
default contentStyle paints every screen opaque, which otherwise makes a
transparent modal look like a separate screen.
src/
  api/transit.ts        Transit public API client, bus trip matching, route shapes
  api/routing.ts        Valhalla client for walking and cycling paths
  lib/routes.ts         Turns live transit + distance into the three route cards
  lib/polyline.ts       Polyline decoding, distances, path slicing
  lib/useDeviceLocation.ts  Location permission and current position
  lib/fonts.ts          Fraunces / Inter loading
  state/appState.tsx    Saved spots, session crowd reports, toasts
  components/           CampusMap, RouteMap, SpotCard, Chips, Onboarding, Toast
  data/                 Spots, categories, crowding levels, Google Maps style
  theme.ts              Design tokens (colors, fonts, overline style)
```

## The map

Google Maps via `react-native-maps` with `PROVIDER_GOOGLE`, styled down to a
transit-app basemap: **streets and water, nothing else**. Buildings, business
and park POI labels, transit icons, terrain and administrative boundaries are
all switched off in [src/data/mapStyle.ts](src/data/mapStyle.ts), because at
campus zoom they compete with the spot pins. Google already thins the road
network by zoom — motorways and arterials when zoomed out, local streets as you
go in — so no per-zoom rules are needed.

The palette is the design's own: warm paper ground, near-white roads with a
hairline border, muted water. `MAP_STYLE_PREVIEW` adds one rule dropping every
label, for the small route previews where street names would be unreadable.

Markers and route lines are the app's own views, drawn as `Marker` and
`Polyline` children: a category-colored circle centred on the coordinate, with
a crowding dot in the corner.

Each marker sits inside a wrapper noticeably larger than the circle itself.
react-native-maps rasterises a marker's children to a bitmap of exactly the
view's bounds, so borders, shadows and the status dot get cut off without that
padding — and `tracksViewChanges` has to be on briefly for the bitmap to be
captured at all, then off so panning does not re-rasterise every marker on
every frame. `useMarkerTracking` handles that.

> **A Google Maps API key is required.** Set `GOOGLE_MAPS_API_KEY` (see
> `.env.example`) with "Maps SDK for Android" and "Maps SDK for iOS" enabled.
> Without it the tiles render blank. The variable is deliberately not prefixed
> `EXPO_PUBLIC_`: [app.config.js](app.config.js) reads it and the plugin writes
> it into Info.plist / AndroidManifest, so it never enters the JS bundle.

## Location

Routes are planned from the device's position. `useDeviceLocation` checks
existing permission on mount but **never prompts there** — the OS dialog is
raised by the onboarding screen's "Allow location & continue", after the screen
has explained what location is for.

Refusal is not fatal. The app falls back to Union South, labels the routes
screen "From Union South", and adds a line saying distances are from campus
rather than from you. The iOS usage string and Android permissions come from the
`expo-location` config plugin in `app.json` (the iOS string is written into
Info.plist at prebuild time, so it will not show in `expo config` output).

## Route geometry

Route lines follow real streets, from two sources:

- **The bus leg** uses the agency's own shape. `route_details` returns an encoded
  polyline and an ordered stop list per itinerary, and the leg is the stretch of
  that shape between the two stops. Matching is by **position and stop order**,
  not by id: `nearby_routes` and `route_details` report the same physical stop
  under different ids (Route F's "Orchard" is `MMTWI:32037` in one and
  `MMTWI:32120` in the other, 61 m apart — opposite platforms of one station).
  Requiring the boarding stop to precede the alighting stop also re-confirms
  direction.
- **Walking and cycling** use [Valhalla](https://valhalla.github.io/valhalla/),
  whose `pedestrian` and `bicycle` costings genuinely differ — 15 min on foot
  against 6 by bike over different paths for the same campus trip. OSRM's public
  demo server was tried first and rejected: it answers every profile with the
  same car route.

Each `RouteSegment` carries an `isPrecise` flag. When a router is unreachable the
segment falls back to a straight line and the UI says so rather than passing an
estimate off as a route. Segments are drawn as map `Polyline`s — walks dashed in
stone, the ride solid in the mode's color.

> The default Valhalla endpoint is the OpenStreetMap community demo server: fine
> for development, but it has a fair-use policy and no uptime guarantee. Set
> `EXPO_PUBLIC_VALHALLA_URL` to your own instance before shipping.

## Live bus routing

The routes screen asks [Transit's public API](https://transitapp.com/apis)
(`nearby_routes`) for departures at both ends of a trip and pairs them by
real-time **trip id** — the same physical bus seen near the origin and near the
destination. Reaching the destination *after* leaving the origin is what proves
the direction is right; comparing stop distances cannot, because a route running
the wrong way passes the same stops in the opposite order.

Set `EXPO_PUBLIC_TRANSIT_API_KEY` in `.env.local` (see `.env.example`). Without
a key the bus option is simply absent and walking/biking still work.

Known limits, all deliberate:

- **Single-bus trips only.** Transit's public API has no trip planner, so no
  transfers. When no single bus connects the two points, the routes screen says
  so and offers the other two modes rather than inventing one.
- **List cards show an estimate**, not a routed time — routing every visible row
  would mean a network call per card. Card values are prefixed "~"; the routes
  screen shows the real routed time, so the two can differ by a minute or two.
- **The key ships in plain text.** `EXPO_PUBLIC_` values are inlined into the JS
  bundle. Transit issues `transit_publicapi_*` keys for client-side use, but
  rotate it from the Transit dashboard if abused.
- **Rate limits.** The API returns HTTP 429 on bursts, so `src/api/transit.ts`
  caches each point's response for 60s and falls back to that cache on a 429.

### The react-dom override

`package.json` pins `react-dom` to the same version as `react` via `overrides`.
Without it `npm ci` fails outright — which is how EAS installs, so cloud builds
break even though a local `npm install` looks fine.

`react-dom` is not a direct dependency: it arrives through Expo Router's web
dependencies (`@expo/ui`, `vaul`, Radix) and resolves to a version whose peer
range the SDK-pinned `react` cannot satisfy. Pinning the two together is the
fix; nothing here renders to the DOM, so the version only has to be coherent.

Re-check after any dependency change with the command EAS actually runs:

```bash
npm ci --include=dev
```

## Builds

**Android in Expo Go already shows the styled map.** Expo Go on Android bundles
the Google Maps SDK (with Expo's own key), so `PROVIDER_GOOGLE` and
`customMapStyle` both work there with no build and no key of your own:

```bash
npx expo start
```

Only **iOS** needs a development build: Expo Go ships no Google Maps SDK on iOS,
so it falls back to Apple Maps and ignores `customMapStyle`. iOS also cannot be
built locally on Windows — it needs macOS and Xcode — so that goes through EAS:

```bash
npx eas build --profile development --platform ios
```

### Local Android builds fail on Windows

`npx expo run:android` currently fails with:

```
ninja: error: Stat(...RNGestureHandlerDetectorShadowNode.cpp.o):
Filename longer than 260 characters
```

CMake mirrors each source file's **full absolute path** inside the object
directory, so the project root appears twice in a single path and the result is
389 characters against Windows' 260 limit.

The usual advice — move the project somewhere shorter — **does not work here**,
and it is worth knowing why before spending time on it. The root contributes
twice, so even a two-character root only reaches 293:

| project root | resulting path |
|---|---|
| current (50 chars) | 389 |
| `C:\dev\uwss` | 311 |
| a `subst` drive such as `X:` | 293 |

`LongPathsEnabled` is already `1` on this machine and does not help either: the
Android SDK's bundled `ninja.exe` is not long-path aware. These C++ targets
exist because `newArchEnabled=true`, and the offending one belongs to
`react-native-gesture-handler`, a transitive dependency of Expo Router.

Build Android on EAS instead — Linux builders have no such limit:

```bash
npx eas build --profile development --platform android
```

[eas.json](eas.json) defines four profiles: `development` (dev client, internal
distribution), `development-simulator` (same, for the iOS Simulator), `preview`,
and `production`.

### Keys on EAS builds

EAS builds run in the cloud and **cannot see your local `.env.local`**. Without
the variables set on EAS, `app.config.js` resolves the Maps key to an empty
string and `EXPO_PUBLIC_TRANSIT_API_KEY` is inlined as undefined — you get a
build with a blank map and no bus routes, from a config that works fine locally.

Push them once per environment:

```bash
npx eas env:push --environment development
```

That reads `.env.local` and uploads each variable. Mark `GOOGLE_MAPS_API_KEY`
as **Sensitive** when prompted; `EXPO_PUBLIC_*` values end up in the JS bundle
either way, so their visibility is cosmetic. Verify with
`npx eas env:list --environment development`.

Each EAS profile also signs with its own keystore, so its SHA-1 differs from the
local debug one — see `npx eas credentials`, and add every fingerprint you build
with to the Maps key's Android restrictions.

## Troubleshooting a blank or black screen

1. **Try Expo Go on Android first.** It bundles `react-native-maps` and
   `expo-location`, and renders the styled Google basemap — the quickest way to
   tell an app bug from a build/key problem. If you are on a dev client instead,
   rebuild it: these two native modules were added recently, and a client built
   before that has no native code for them and will crash on launch.
2. **Read the error.** The root layout exports an `ErrorBoundary`
   ([app/_layout.tsx](app/_layout.tsx)) that renders the message and stack
   instead of a blank window, so a startup crash says what failed. Maps are
   additionally wrapped in `MapErrorBoundary`, so a native map failure shows an
   inline message rather than taking the screen down with it.
3. **iOS in Expo Go shows an unstyled map, not a black one.** `PROVIDER_GOOGLE`
   has no SDK behind it there, so [src/lib/mapProvider.ts](src/lib/mapProvider.ts)
   falls back to Apple Maps and logs a warning. `customMapStyle` is ignored in
   that mode — build a dev client for the styled basemap.
4. **Check the key.** `npm run check:maps` validates format and calls Google to
   confirm the key is live, then lists what only the Cloud Console can confirm
   (see below). `npx expo config --type public` shows whether it reached the
   native config at all — `app.config.js` reads `GOOGLE_MAPS_API_KEY` from
   `.env.local`; it is not `EXPO_PUBLIC_`, so it never enters the JS bundle.
5. **Android SHA-1.** If your key uses Android application restrictions, run
   `npm run android:sha1` for the debug fingerprint. Each signing identity has
   its own — an EAS build (`npx eas credentials`) and a Play Store build (Play
   Console > App signing) differ from the local debug one, and every identity
   you use needs its own entry on the key.
6. **Check the bundle id matches your key's restrictions.** A key restricted by
   app rejects any app whose identifier does not match. This project declares
   `com.uwstudyspots.app` for both platforms in `app.config.js` — change it if
   you restricted your key to something else. (Expo's fallback when these are
   unset is `com.placeholder.appid`, which matches nothing.)

## Still to wire up

1. **Crowd reports are session-only.** [src/state/appState.tsx](src/state/appState.tsx)
   holds them in memory; the seeded `status`/`age`/`votes` in `spots.ts` stand in
   for a backend. Point these at the website's `/api/busyness` endpoints.
2. **Navigation advances on a timer**, not on location updates. The position is
   read once when a screen mounts; `watchPositionAsync` would be needed to
   follow the user along the route and detect arrival.
3. **One approximate coordinate.** Every spot was geocoded against
   OpenStreetMap except the Law Library, which OSM has no entry for; verify it
   before shipping directions there. Its address was also corrected from the
   design's mock value.
4. **App icons/splash** are still the generic Expo placeholders.
5. **Config moved to [app.config.js](app.config.js)** so the Maps key can come
   from the environment. There is no longer an `app.json`.

## Relationship to the website repo

This is a separate repo/app from `uw-study-spots-map`. They share the category
colors/labels and the study spot dataset (currently duplicated by hand), and
will share the crowd-report backend once step 1 above is done.
