# UW Study Spots — App

Mobile companion app for [uw-study-spots-map](https://github.com/Awonder9/uw-study-spots-map), built with [Expo](https://expo.dev) (React Native + TypeScript + Expo Router).

This is a **skeleton** — the screens and navigation are wired up, but real data and the live API still need to be connected. See "Next steps" below.

## Stack

- Expo SDK 57 / React Native 0.86
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation, in `app/`)
- `react-native-maps` for the map tab
- `@react-native-async-storage/async-storage` for the local anonymous device ID (mirrors the website's `localStorage` device ID)

## Project structure

```
app/                    Expo Router routes (screens)
  (tabs)/
    index.tsx           Spot list — search + category filter
    map.tsx             Map view with markers
  spot/[id].tsx          Spot detail (modal) — directions, busyness reporting
  suggest.tsx            Suggest a spot form (modal)
  _layout.tsx            Root stack
src/
  api/                   Fetch wrappers for the Cloudflare Pages Functions
                         backend (busyness, feedback, suggest-spot)
  components/            SpotCard, CategoryPill
  data/                  Category metadata + placeholder spot data
  lib/                   deviceId helper
  types/                 Shared TypeScript types
  theme.ts               Colors
```

## Getting started

```bash
npm install
npm run start   # then press i / a / w, or scan the QR code with Expo Go
```

`npm run typecheck` runs `tsc --noEmit`.

## Next steps

This app currently has **placeholder data and no working backend connection** — both need to be wired up before this is a real app:

1. **Point at the deployed backend.** Set `API_BASE_URL` in [src/api/client.ts](src/api/client.ts) to the website's deployed Cloudflare Pages URL (or custom domain) once it has one. The app calls the same `/api/busyness`, `/api/feedback`, and `/api/suggest-spot` endpoints the website uses.
2. **Replace the placeholder spot list.** [src/data/spots.ts](src/data/spots.ts) only has 3 sample spots copied from the website's `data.js`. The full dataset lives in the website repo and isn't served over an API yet — either add a `GET /api/spots` Cloudflare Function that returns it, or extract `data.js` into a package both repos can import. Once that exists, replace `src/data/spots.ts` with a fetch against it instead of hardcoded data.
3. **App icons/splash.** `assets/` currently has the generic Expo placeholder icons — swap in UW-branded ones.
4. **EAS Build** (when ready to test on a real device or submit to app stores): `npx eas login` then `npx eas build`.

## Relationship to the website repo

This is a separate repo/app from `uw-study-spots-map`. They share:
- The same category colors/labels and study spot dataset (currently duplicated by hand — see step 2 above)
- The same backend API (Cloudflare Pages Functions + KV), once `API_BASE_URL` is set
