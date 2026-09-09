import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CampusMap } from "@/components/CampusMap";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { CategoryPill, TagChip } from "@/components/Chips";
import { SpotCard } from "@/components/SpotCard";
import { Toast } from "@/components/Toast";
import { CAT, CATS, TAGS } from "@/data/categories";
import { SPOTS } from "@/data/spots";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Category, Spot } from "@/types/spot";

export default function HomeScreen() {
  const router = useRouter();
  const { hasNewUpdate } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [tag, setTag] = useState<string | null>(null);
  const [mapView, setMapView] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SPOTS.filter((spot) => {
      if (category !== "All" && spot.cat !== category) return false;
      if (tag && !spot.tags.includes(tag)) return false;
      if (!q) return true;
      const haystack = `${spot.name} ${spot.address} ${spot.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category, tag]);

  function openSpot(spot: Spot) {
    setSelectedId(spot.id);
    router.push(`/spot/${spot.id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={12.5} color={colors.faint} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search spots, buildings, tags…"
              placeholderTextColor={colors.faint}
              autoCorrect={false}
            />
          </View>
          <Pressable
            style={styles.viewToggle}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={mapView ? "Show list view" : "Show map view"}
            onPress={() => setMapView((current) => !current)}
          >
            <Ionicons name={mapView ? "list" : "map"} size={17} color={colors.muted} />
          </Pressable>
          <Pressable
            style={styles.viewToggle}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Updates"
            onPress={() => router.push("/updates")}
          >
            <Ionicons name="megaphone-outline" size={17} color={colors.muted} />
            {hasNewUpdate ? <View style={styles.updateDot} /> : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATS.map((item) => (
            <CategoryPill
              key={item}
              label={item}
              color={item === "All" ? colors.ink : CAT[item].color}
              active={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TAGS.map((item) => (
            <TagChip
              key={item}
              label={item}
              active={tag === item}
              onPress={() => setTag(tag === item ? null : item)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {mapView ? (
          <MapErrorBoundary label="campus map">
            <CampusMap spots={list} selectedId={selectedId} onSelect={openSpot} />
          </MapErrorBoundary>
        ) : null}

        <View style={mapView ? styles.sheet : styles.fullList}>
          <Text style={styles.count}>
            {list.length} {list.length === 1 ? "spot" : "spots"} nearby
          </Text>
          <ScrollView contentContainerStyle={styles.listContent}>
            {list.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onPress={openSpot} />
            ))}
            {list.length === 0 ? (
              <Text style={styles.empty}>No spots match those filters.</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>

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
    paddingHorizontal: 16,
    paddingTop: 6,
    zIndex: 30
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 17,
    color: colors.ink,
    padding: 0
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  updateDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.uwRed,
    borderWidth: 1.5,
    borderColor: colors.surface
  },
  pillRow: {
    gap: 7,
    paddingTop: 11,
    paddingBottom: 10
  },
  chipRow: {
    gap: 6,
    paddingBottom: 11
  },
  body: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.mapLand
  },
  // Over the map the list is a bottom sheet; on its own it fills the screen.
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "44%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 14,
    zIndex: 20,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10
  },
  fullList: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingTop: 14
  },
  count: {
    ...overline,
    fontSize: 10.5,
    lineHeight: 14,
    paddingHorizontal: 4,
    paddingBottom: 10
  },
  listContent: {
    gap: 9,
    paddingBottom: 26
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: colors.faint,
    textAlign: "center",
    paddingVertical: 30
  }
});
