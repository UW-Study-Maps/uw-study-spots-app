import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { OptionButton } from "@/components/Chips";
import { CROWD_ICON, CROWD_ORDER, NOISE_OPTS, OUTLET_OPTS, ST } from "@/data/categories";
import { getSpot } from "@/data/spots";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { CrowdLevel, NoiseLevel, OutletLevel } from "@/types/spot";

export default function ReportScreen() {
  const { id, context } = useLocalSearchParams<{ id: string; context?: string }>();
  const router = useRouter();
  const { submitReport, showToast } = useAppState();

  const [crowd, setCrowd] = useState<CrowdLevel | null>(null);
  const [noise, setNoise] = useState<NoiseLevel | null>(null);
  const [outlets, setOutlets] = useState<OutletLevel | null>(null);

  const spot = getSpot(id);
  const isArrival = context === "arrival";

  function dismiss() {
    // Arriving lands here from navigation, so there is nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function submit() {
    if (!crowd || !spot) return;
    submitReport(spot.id, { crowd, noise, outlets });
    showToast(
      `${spot.name} marked ${ST[crowd].label.toLowerCase()}. Thanks — everyone heading over sees it now.`
    );
    dismiss();
  }

  if (!spot) {
    return (
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <View style={styles.sheet}>
          <Text style={styles.missing}>That spot no longer exists.</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <View style={styles.sheet}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.contextChip}>
            <View style={styles.contextDot} />
            <Text style={styles.contextText}>
              {isArrival ? "You've arrived" : "Manual check-in"}
            </Text>
          </View>

          <Text style={styles.title}>
            {isArrival ? `How full is ${spot.name}?` : `Report ${spot.name}`}
          </Text>
          <Text style={styles.sub}>Three taps. Everyone heading over sees it instantly.</Text>

          <Text style={styles.sectionLabel}>Crowding</Text>
          <View style={styles.crowdGrid}>
            {CROWD_ORDER.map((level) => (
              <View key={level} style={styles.crowdCell}>
                <OptionButton
                  label={ST[level].label}
                  icon={CROWD_ICON[level]}
                  color={ST[level].color}
                  active={crowd === level}
                  onPress={() => setCrowd(level)}
                />
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Noise</Text>
          <View style={styles.row}>
            {NOISE_OPTS.map((level) => (
              <OptionButton
                key={level}
                label={level}
                active={noise === level}
                onPress={() => setNoise(level)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Outlets</Text>
          <View style={styles.row}>
            {OUTLET_OPTS.map((level) => (
              <OptionButton
                key={level}
                label={level}
                active={outlets === level}
                onPress={() => setOutlets(level)}
              />
            ))}
          </View>

          <Pressable
            style={[styles.submit, !crowd && styles.submitDisabled]}
            disabled={!crowd}
            onPress={submit}
          >
            <Text style={styles.submitText}>
              {crowd ? "Post report" : "Pick a crowding level"}
            </Text>
          </Pressable>

          <Pressable style={styles.dismiss} onPress={dismiss}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(29,26,23,0.45)"
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: 12
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32
  },
  missing: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
    padding: 30,
    textAlign: "center"
  },
  contextChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.uwRedTint,
    borderWidth: 1,
    borderColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  contextDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.uwRed
  },
  contextText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.uwRedDeep
  },
  title: {
    fontFamily: fonts.displayS,
    fontSize: 23,
    lineHeight: 30,
    color: colors.ink,
    marginTop: 12,
    marginBottom: 4
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: colors.faint,
    marginBottom: 18
  },
  sectionLabel: {
    ...overline,
    marginBottom: 9,
    marginTop: 16
  },
  crowdGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  // Two per row, matching the design's default "Chips" report style.
  crowdCell: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row"
  },
  row: {
    flexDirection: "row",
    gap: 7
  },
  submit: {
    marginTop: 20,
    backgroundColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center"
  },
  submitDisabled: {
    backgroundColor: colors.disabled
  },
  submitText: {
    fontFamily: fonts.semi,
    fontSize: 15,
    lineHeight: 19,
    color: "#fff"
  },
  dismiss: {
    paddingTop: 12,
    alignItems: "center"
  },
  dismissText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.faint
  }
});
