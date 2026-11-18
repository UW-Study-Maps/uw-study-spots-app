import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpotCard } from "@/components/SpotCard";
import { StepSlider } from "@/components/StepSlider";
import { Toast } from "@/components/Toast";
import { BUSYNESS_STEPS, rankSpots, TRANSIT_STEPS, type RankedSpot } from "@/lib/ranking";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Spot } from "@/types/spot";

export default function FindScreen() {
  const router = useRouter();
  const { location, statusOf, isSaved, spots } = useAppState();
  const [busyIndex, setBusyIndex] = useState(0);
  const [transitIndex, setTransitIndex] = useState(0);
  const [results, setResults] = useState<RankedSpot[] | null>(null);

  function runSearch() {
    const ranked = rankSpots(spots, location.origin, statusOf, busyIndex, transitIndex);
    setResults(ranked.slice(0, 5));
  }

  function openSpot(spot: Spot) {
    router.push(`/spot/${spot.id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a spot</Text>
        <Text style={styles.subtitle}>
          Set how busy you can handle and how far you'll go, then get your best matches.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.panel}>
          <StepSlider
            label="How busy can it be?"
            steps={BUSYNESS_STEPS}
            value={busyIndex}
            onChange={setBusyIndex}
          />
        </View>

        <View style={styles.panel}>
          <StepSlider
            label="How far are you willing to go?"
            steps={TRANSIT_STEPS}
            value={transitIndex}
            onChange={setTransitIndex}
          />
        </View>

        <Pressable style={styles.searchBtn} onPress={runSearch}>
          <Ionicons name="search" size={15} color="#fff" />
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>

        {results ? (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {results.length ? "Top matches" : "No spots to show"}
            </Text>
            <View style={styles.resultsList}>
              {results.map((ranked, index) => (
                <SpotCard
                  key={ranked.spot.id}
                  spot={ranked.spot}
                  rank={index + 1}
                  saved={isSaved(ranked.spot.id)}
                  onPress={openSpot}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.hint}>
            <Ionicons name="options-outline" size={30} color={colors.faint} />
            <Text style={styles.hintTitle}>Ready when you are</Text>
            <Text style={styles.hintText}>
              Set your preferences above, then tap Search for your best matches.
            </Text>
          </View>
        )}
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14
  },
  title: {
    fontFamily: fonts.displayS,
    fontSize: 22,
    lineHeight: 29,
    color: colors.ink
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.faint,
    marginTop: 4
  },
  body: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 30,
    gap: 12
  },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 15
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 2
  },
  searchBtnText: {
    fontFamily: fonts.semi,
    fontSize: 14.5,
    lineHeight: 19,
    color: "#fff"
  },
  results: {
    marginTop: 8
  },
  resultsTitle: {
    ...overline,
    marginBottom: 10,
    paddingHorizontal: 2
  },
  resultsList: {
    gap: 9
  },
  hint: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40
  },
  hintTitle: {
    fontFamily: fonts.displayS,
    fontSize: 17,
    lineHeight: 23,
    color: colors.ink,
    marginTop: 4
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.faint,
    textAlign: "center"
  }
});
