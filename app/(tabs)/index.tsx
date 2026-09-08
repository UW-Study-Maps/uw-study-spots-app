import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryPill } from "@/components/CategoryPill";
import { SpotCard } from "@/components/SpotCard";
import { CATEGORY_META } from "@/data/categories";
import { STUDY_SPOTS } from "@/data/spots";
import { colors } from "@/theme";
import type { Category, Spot } from "@/types/spot";

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export default function SpotListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    return STUDY_SPOTS.filter((spot) => {
      if (category !== "All" && spot.category !== category) return false;
      if (search) {
        const haystack = `${spot.name} ${spot.address} ${spot.description} ${spot.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [search, category]);

  function openSpot(spot: Spot) {
    router.push(`/spot/${spot.id}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search spots, buildings, tags…"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        horizontal
        data={["All", ...CATEGORIES]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        renderItem={({ item }) => (
          <CategoryPill
            label={item === "All" ? "All" : CATEGORY_META[item as Category].label}
            icon={item === "All" ? "grid" : (CATEGORY_META[item as Category].icon as any)}
            color={item === "All" ? undefined : CATEGORY_META[item as Category].color}
            active={category === item}
            onPress={() => setCategory(item as Category | "All")}
          />
        )}
      />

      <Text style={styles.resultsCount}>
        {filtered.length} {filtered.length === 1 ? "spot" : "spots"} found
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <SpotCard spot={item} onPress={openSpot} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No spots match your filters.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text
  },
  pillsRow: {
    gap: 8,
    paddingVertical: 12
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8
  },
  list: {
    paddingBottom: 24
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center"
  },
  emptyText: {
    color: colors.textMuted
  }
});
