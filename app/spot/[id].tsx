import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getBusyness, reportBusyness } from "@/api/busyness";
import { CATEGORY_META } from "@/data/categories";
import { STUDY_SPOTS } from "@/data/spots";
import { getDeviceId } from "@/lib/deviceId";
import { colors } from "@/theme";
import type { BusynessLevel, BusynessStatus } from "@/types/spot";

const BUSYNESS_META: Record<BusynessLevel, { label: string; icon: string }> = {
  empty: { label: "Empty", icon: "checkmark-circle" },
  "some-seats": { label: "Some seats", icon: "person" },
  busy: { label: "Busy", icon: "people" },
  full: { label: "Full", icon: "warning" }
};
const BUSYNESS_ORDER: BusynessLevel[] = ["empty", "some-seats", "busy", "full"];

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const spot = STUDY_SPOTS.find((s) => s.id === id);

  const [busyness, setBusyness] = useState<BusynessStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!spot) return;
    getBusyness(spot.id)
      .then(setBusyness)
      .catch(() => setBusyness(null));
  }, [spot?.id]);

  if (!spot) {
    return (
      <View style={styles.center}>
        <Text>Spot not found.</Text>
      </View>
    );
  }

  const meta = CATEGORY_META[spot.category];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${spot.name}, ${spot.address}`
  )}`;

  async function submitReport(level: BusynessLevel) {
    if (!spot) return;
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const result = await reportBusyness(spot.id, level, deviceId);
      if (result.ok) {
        const updated = await getBusyness(spot.id);
        setBusyness(updated);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.icon as any} size={40} color="#fff" />
      </View>

      <View style={styles.badgeRow}>
        <Text style={[styles.badge, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.badge}>{spot.affiliation}</Text>
      </View>

      <Text style={styles.name}>{spot.name}</Text>
      <View style={styles.addressRow}>
        <Ionicons name="location" size={14} color={colors.textMuted} />
        <Text style={styles.address}>{spot.address}</Text>
      </View>

      <Pressable
        style={styles.directionsBtn}
        onPress={() => Linking.openURL(mapsUrl)}
      >
        <Ionicons name="navigate" size={16} color="#fff" />
        <Text style={styles.directionsText}>Get Directions</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>How busy is it right now?</Text>
      <View style={styles.busynessBox}>
        {busyness?.level ? (
          <Text style={styles.busynessStatus}>
            {BUSYNESS_META[busyness.level].label} · {busyness.recentCount}{" "}
            {busyness.recentCount === 1 ? "report" : "reports"}
          </Text>
        ) : (
          <Text style={styles.busynessStatus}>No recent reports — be the first to check in.</Text>
        )}
        <View style={styles.busynessButtons}>
          {BUSYNESS_ORDER.map((level) => (
            <Pressable
              key={level}
              style={styles.busynessBtn}
              disabled={submitting}
              onPress={() => submitReport(level)}
            >
              <Ionicons name={BUSYNESS_META[level].icon as any} size={14} color={colors.text} />
              <Text style={styles.busynessBtnText}>{BUSYNESS_META[level].label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>About this spot</Text>
      <Text style={styles.description}>{spot.description}</Text>

      <Text style={styles.sectionLabel}>Tags</Text>
      <View style={styles.tagsRow}>
        {spot.tags.map((tag) => (
          <Text key={tag} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  hero: {
    height: 100,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6
  },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16
  },
  address: {
    fontSize: 13,
    color: colors.textMuted
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.uwRed,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24
  },
  directionsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4
  },
  busynessBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10
  },
  busynessStatus: {
    fontSize: 13,
    color: colors.text
  },
  busynessButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  busynessBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  busynessBtnText: {
    fontSize: 12,
    color: colors.text
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 20
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10
  }
});
