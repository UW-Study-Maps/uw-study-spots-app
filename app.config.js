// Dynamic config so the Google Maps key can come from the environment rather
// than being committed. Expo CLI loads .env files into process.env before
// evaluating this file; the variable is deliberately NOT prefixed
// EXPO_PUBLIC_, so it reaches the native Info.plist / AndroidManifest without
// also being inlined into the JS bundle.
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

module.exports = {
  expo: {
    name: "UW Study Spots",
    slug: "uw-study-spots-app",
    scheme: "uwstudyspots",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      // Must be set explicitly. Without it Expo falls back to
      // "com.placeholder.appid", and a Google Maps key with iOS application
      // restrictions will reject the app at runtime — a valid key, blank map.
      // Change this if you restricted your key to a different bundle id.
      bundleIdentifier: "com.uwstudyspots.app"
    },
    android: {
      // Same reason as ios.bundleIdentifier above.
      package: "com.uwstudyspots.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
          androidGoogleMapsApiKey: GOOGLE_MAPS_API_KEY
        }
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "UW Study Spots uses your location to sort study spots by walking distance and to plan routes from where you are."
        }
      ]
    ],
    extra: {
      // Written by eas-cli when the project was linked; do not edit by hand.
      eas: {
        projectId: "58ad7080-0bba-40c6-8225-5d4e2a9ec1fd"
      },
      // Fallbacks for builds that inject config instead of env vars. Normally
      // empty — the real values come from .env.local locally, and from EAS
      // environment variables in cloud builds.
      transitApiKey: "",
      valhallaUrl: "",
      studySpotsApiUrl: ""
    }
  }
};
