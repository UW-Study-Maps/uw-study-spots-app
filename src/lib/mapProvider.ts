import Constants, { AppOwnership } from "expo-constants";
import { Platform } from "react-native";
import { PROVIDER_GOOGLE, type MapViewProps } from "react-native-maps";

/**
 * True only inside Expo Go.
 *
 * `appOwnership` is deprecated in favour of `executionEnvironment`, but that
 * reports `storeClient` for both Expo Go *and* a dev client — and a dev client
 * built from this project does have the Google Maps SDK. `appOwnership` is
 * still the only value that separates the two.
 */
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

/**
 * Expo Go on iOS ships no Google Maps SDK. Asking for `PROVIDER_GOOGLE` there
 * does not fall back gracefully — it renders a black view — so on that one
 * combination the platform default (Apple Maps) is used instead. Android's
 * default provider *is* Google, so it is unaffected.
 *
 * The visible consequence in Expo Go on iOS is that `customMapStyle` is
 * ignored: the map renders, but as a stock Apple basemap rather than the
 * styled one. Build a dev client (`npx expo run:ios`) for the real thing.
 */
export const MAP_PROVIDER: MapViewProps["provider"] =
  Platform.OS === "ios" && isExpoGo ? undefined : PROVIDER_GOOGLE;

/** True when the current runtime can actually apply `customMapStyle`. */
export const SUPPORTS_MAP_STYLE = MAP_PROVIDER === PROVIDER_GOOGLE;

if (__DEV__ && !SUPPORTS_MAP_STYLE) {
  console.warn(
    "[maps] Expo Go on iOS has no Google Maps SDK, so the map falls back to " +
      "Apple Maps and the custom style is ignored. Run `npx expo run:ios` for " +
      "a dev client with the styled basemap."
  );
}
