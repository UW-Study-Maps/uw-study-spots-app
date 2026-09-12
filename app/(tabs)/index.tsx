import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTransitTimes, StudySpotsNotConfiguredError } from "@/api/studySpots";
import { CampusMap } from "@/components/CampusMap";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { CategoryPill, TagChip } from "@/components/Chips";
import { SpotCard } from "@/components/SpotCard";
import { Toast } from "@/components/Toast";
import { CAT, CATS, TAGS } from "@/data/categories";
import { distanceMeters } from "@/lib/polyline";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Category, Spot } from "@/types/spot";

type SortMode = "default" | "distance" | "busyness" | "transit";
type TransitStatus = "idle" | "loading" | "loaded" | "error" | "unconfigured";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "default", label: "Alphabetical" },
  { key: "distance", label: "Distance" },
  { key: "busyness", label: "Least busy" },
  { key: "transit", label: "Transit time" }
];

export default function HomeScreen() {
  const router = useRouter();
  const { hasNewUpdate, spots, statusOf, location } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [mapView, setMapView] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("default");
  const [transitMinutes, setTransitMinutes] = useState<Record<string, number> | null>(null);
  const [transitLive, setTransitLive] = useState(false);
  const [transitStatus, setTransitStatus] = useState<TransitStatus>("idle");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((spot) => {
      if (category !== "All" && spot.cat !== category) return false;
      for (const tag of activeTags) {
        if (!spot.tags.includes(tag)) return false;
      }
      if (!q) return true;
      const haystack = `${spot.name} ${spot.address} ${spot.desc} ${spot.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [spots, query, category, activeTags]);

  // Only fetches once "Transit time" is actually selected, same as the
  // website — and only every time the origin genuinely changes while it is.
  useEffect(() => {
    if (sort !== "transit") return;
    let cancelled = false;
    setTransitStatus("loading");
    fetchTransitTimes(location.origin)
      .then((result) => {
        if (cancelled) return;
        setTransitMinutes(result.minutes);
        setTransitLive(result.live);
        setTransitStatus("loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setTransitStatus(err instanceof StudySpotsNotConfiguredError ? "unconfigured" : "error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, location.origin.lat, location.origin.lng]);

  const sortNote = useMemo(() => {
    if (sort === "distance" && location.isFallback) {
      return `Distances are from ${location.label} — allow location for distances from you.`;
    }
    if (sort === "transit") {
      if (transitStatus === "loading") return "Estimating transit times…";
      if (transitStatus === "error") {
        return "Couldn't estimate transit times — showing alphabetical order instead.";
      }
      if (transitStatus === "unconfigured") {
        return "Transit time sorting isn't available in this build yet — showing alphabetical order instead.";
      }
      if (transitStatus === "loaded" && !transitLive) {
        return "Showing walking-distance estimates — live transit times aren't configured.";
      }
      if (transitStatus === "loaded" && location.isFallback) {
        return `Estimated from ${location.label}.`;
      }
    }
    return "";
  }, [sort, location.isFallback, location.label, transitStatus, transitLive]);

  const sortedList = useMemo(() => {
    const byName = (a: Spot, b: Spot) => a.name.localeCompare(b.name);
    const sortWith = (rank: (a: Spot, b: Spot) => number) =>
      [...list].sort((a, b) => rank(a, b) || byName(a, b));

    if (sort === "distance") {
      return sortWith(
        (a, b) =>
          distanceMeters(location.origin, { lat: a.lat, lng: a.lng }) -
          distanceMeters(location.origin, { lat: b.lat, lng: b.lng })
      );
    }
    if (sort === "busyness") {
      // Unreported spots sort after every known level rather than being
      // treated as empty — we simply don't know, so "least busy" shouldn't imply it.
      const rank = (spot: Spot) => {
        const n = statusOf(spot).n;
        return n === -1 ? 4 : n;
      };
      return sortWith((a, b) => rank(a) - rank(b));
    }
    if (sort === "transit" && transitStatus === "loaded" && transitMinutes) {
      return sortWith((a, b) => {
        const ta = transitMinutes[a.id] ?? Infinity;
        const tb = transitMinutes[b.id] ?? Infinity;
        return ta - tb;
      });
    }
    return [...list].sort(byName);
  }, [list, sort, location.origin, statusOf, transitStatus, transitMinutes]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setActiveTags(new Set());
  }

  function toggleTag(tag: string) {
    setActiveTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

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
            accessibilityLabel="More"
            onPress={() => router.push("/more")}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color={colors.muted} />
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
              active={activeTags.has(item)}
              onPress={() => toggleTag(item)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {mapView ? (
          <MapErrorBoundary label="campus map">
            <CampusMap spots={sortedList} selectedId={selectedId} onSelect={openSpot} />
          </MapErrorBoundary>
        ) : null}

        <View style={mapView ? styles.sheet : styles.fullList}>
          <Text style={styles.count}>
            {sortedList.length} {sortedList.length === 1 ? "spot" : "spots"} nearby
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setSort(opt.key)}
                style={[styles.sortPill, sort === opt.key && styles.sortPillActive]}
              >
                <Text style={[styles.sortPillText, sort === opt.key && styles.sortPillTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {sortNote ? <Text style={styles.sortNoteText}>{sortNote}</Text> : null}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {sortedList.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onPress={openSpot} />
            ))}
            {sortedList.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="cafe-outline" size={24} color={colors.faint} />
                <Text style={styles.emptyText}>No spots match your filters.</Text>
                <Pressable style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear filters</Text>
                </Pressable>
              </View>
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
  // Tall enough to fit the sort row above the list without squeezing it —
  // the plain count-only header this replaced fit fine at 44%.
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
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
    paddingBottom: 6
  },
  sortRow: {
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 6
  },
  sortPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  sortPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  sortPillText: {
    fontFamily: fonts.semi,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.muted
  },
  sortPillTextActive: {
    color: "#fff"
  },
  sortNoteText: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.faint,
    paddingHorizontal: 4,
    paddingBottom: 6
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: 9,
    paddingBottom: 26
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 30
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: colors.faint,
    textAlign: "center"
  },
  clearBtn: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border
  },
  clearBtnText: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.ink
  }
});
