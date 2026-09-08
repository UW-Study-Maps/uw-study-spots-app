import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpotCard } from "@/components/SpotCard";
import { Toast } from "@/components/Toast";
import { SPOTS } from "@/data/spots";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Spot } from "@/types/spot";

export default function SavedScreen() {
  const router = useRouter();
  const { savedIds } = useAppState();
  const saved = SPOTS.filter((spot) => savedIds.includes(spot.id));

  function openSpot(spot: Spot) {
    router.push(`/spot/${spot.id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved spots</Text>
        <Text style={styles.count}>
          {saved.length} {saved.length === 1 ? "spot" : "spots"}
        </Text>
      </View>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={30} color={colors.faint} />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyBody}>
            Tap the bookmark on any spot to keep it here for later.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {saved.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onPress={openSpot} />
          ))}
        </ScrollView>
      )}

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
  count: {
    ...overline,
    marginTop: 4
  },
  list: {
    padding: 14,
    gap: 9
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontFamily: fonts.displayS,
    fontSize: 17,
    lineHeight: 23,
    color: colors.ink,
    marginTop: 4
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.faint,
    textAlign: "center"
  }
});
