import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SPOTS } from "@/data/spots";
import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";

const PERMISSIONS = [
  {
    icon: "locate",
    title: "Location",
    body: "Sorts spots by walking distance and knows when you've arrived."
  },
  {
    icon: "notifications",
    title: "Notifications",
    body: "One tap to report a spot when you get there or head out."
  }
];

/**
 * First-run screen, and the only place the location prompt is raised — see
 * `allowAndContinue`. Notifications are described but not requested; nothing in
 * the app sends one yet, so asking would be premature.
 */
export function Onboarding() {
  const { finishOnboarding, location } = useAppState();
  const [asking, setAsking] = useState(false);

  // The OS dialog is deliberately raised here rather than at launch, so the
  // screen above it has already said what location is for. Either answer moves
  // on — a refusal just means routes are planned from campus instead.
  async function allowAndContinue() {
    setAsking(true);
    try {
      await location.request();
    } finally {
      finishOnboarding();
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>UW</Text>
        </View>

        <Text style={styles.heading}>Find a seat before you walk over.</Text>
        <Text style={styles.sub}>
          {SPOTS.length} spots across campus and Madison, with crowd reports from students
          who are there right now.
        </Text>

        <View style={styles.permissions}>
          {PERMISSIONS.map((item) => (
            <View key={item.title} style={styles.permission}>
              <Ionicons
                name={item.icon as never}
                size={15}
                color={colors.amber}
                style={styles.permissionIcon}
              />
              <View style={styles.permissionBody}>
                <Text style={styles.permissionTitle}>{item.title}</Text>
                <Text style={styles.permissionText}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <Pressable style={styles.primary} disabled={asking} onPress={allowAndContinue}>
          {asking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Allow location &amp; continue</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondary} onPress={finishOnboarding}>
          <Text style={styles.secondaryText}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 56,
    paddingBottom: 24
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.uwRed,
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: {
    fontFamily: fonts.displayB,
    fontSize: 22,
    color: "#fff"
  },
  heading: {
    fontFamily: fonts.displayS,
    fontSize: 30,
    lineHeight: 35,
    color: "#fff",
    marginTop: 26,
    marginBottom: 12
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 23,
    color: "rgba(255,255,255,0.62)",
    marginBottom: 30
  },
  permissions: {
    gap: 14
  },
  permission: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start"
  },
  permissionIcon: {
    width: 20,
    marginTop: 2
  },
  permissionBody: {
    flex: 1
  },
  permissionTitle: {
    fontFamily: fonts.semi,
    fontSize: 14,
    color: "#fff"
  },
  permissionText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)"
  },
  spacer: {
    flex: 1,
    minHeight: 24
  },
  primary: {
    backgroundColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center"
  },
  primaryText: {
    fontFamily: fonts.semi,
    fontSize: 15.5,
    color: "#fff"
  },
  secondary: {
    paddingTop: 16,
    alignItems: "center"
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.5)"
  }
});
