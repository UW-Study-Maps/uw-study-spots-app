import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Onboarding } from "@/components/Onboarding";
import { useAppFonts } from "@/lib/fonts";
import { AppStateProvider, useAppState } from "@/state/appState";
import { colors } from "@/theme";

/**
 * The root layout must render a navigator on *every* render, including the
 * first.
 *
 * Expo Router hides the splash screen from `store.onReady()`, which only fires
 * once a navigator mounts. Returning a loading view or the onboarding screen
 * *instead of* the Stack means that never happens, the splash is never
 * dismissed, and the app sits on a blank screen forever. So the Stack is always
 * mounted and the pre-app states are layered over it.
 */
/** Shared options for the two bottom sheets — see the comment at their usage. */
const SHEET_OPTIONS = {
  presentation: "transparentModal",
  animation: "fade",
  contentStyle: { backgroundColor: "transparent" }
} as const;

function RootNavigator() {
  const { hydrated, onboarded } = useAppState();
  const fontsLoaded = useAppFonts();
  const ready = fontsLoaded && hydrated;

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        {/*
          Both sheets sit over the screen that opened them. `transparentModal`
          keeps that screen mounted underneath, but only shows it if the modal
          itself is see-through — and the stack's default contentStyle paints
          every screen with the app background, which is what made these look
          like separate screens. Each one has to opt back out to transparent.
          `fade` because a slide would animate the dimmed backdrop in from the
          edge, which reads as a new screen rather than an overlay.
        */}
        <Stack.Screen name="spot/[id]" options={SHEET_OPTIONS} />
        <Stack.Screen name="report/[id]" options={SHEET_OPTIONS} />
        <Stack.Screen name="updates" options={SHEET_OPTIONS} />
        <Stack.Screen name="routes/[id]" />
        <Stack.Screen name="nav/[id]" />
      </Stack>

      {/* Covers the first frames on the app's own ground rather than flashing
          a fallback font or an un-onboarded screen. */}
      {ready ? null : <View style={[StyleSheet.absoluteFill, styles.cover]} />}

      {ready && !onboarded ? (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Expo Router renders this instead of the screen when a render throws.
 *
 * Without it a startup crash leaves a bare black window, which says nothing
 * about what failed — most likely a native module missing from the running
 * client (this app needs `react-native-maps` and `expo-location`, so a dev
 * client built before those were added has to be rebuilt).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorScreen}>
      <ScrollView contentContainerStyle={styles.errorContent}>
        <Text style={styles.errorTitle}>Something crashed on startup</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        {error.stack ? <Text style={styles.errorStack}>{error.stack}</Text> : null}
        <Pressable style={styles.errorButton} onPress={retry}>
          <Text style={styles.errorButtonText}>Try again</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg
  },
  cover: {
    backgroundColor: colors.bg
  },
  errorScreen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  errorContent: {
    padding: 24,
    paddingTop: 72
  },
  errorTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 12
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.uwRed,
    marginBottom: 16
  },
  errorStack: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    fontFamily: "monospace"
  },
  errorButton: {
    marginTop: 24,
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  errorButtonText: {
    color: "#fff",
    fontWeight: "600"
  }
});
