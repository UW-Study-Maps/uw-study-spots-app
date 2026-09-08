import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { RouteMap } from "@/components/RouteMap";
import { getSpot } from "@/data/spots";
import { planRoutes, type RoutePlan } from "@/lib/routes";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { TravelMode } from "@/types/spot";

// The design promises live departures refreshing on a short cycle; 20s is what
// it says, and matches how fast a "departs in 2 min" number goes stale.
const REFRESH_INTERVAL_MS = 20_000;

export default function RoutesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const spot = getSpot(id);
  const { location } = useAppState();

  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [mode, setMode] = useState<TravelMode | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!spot) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const next = await planRoutes(location.origin, spot, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPlan(next);
      // Preselect the fastest option the first time only — re-selecting on
      // every refresh would yank the choice out from under the user.
      setMode((current) => current ?? next.options.find((o) => o.tag === "Fastest")?.key ?? "walk");
    } catch {
      if (!controller.signal.aborted) setPlan(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [spot, location.origin]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [load]);

  if (!spot) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.missing}>That spot no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const chosen = plan?.options.find((option) => option.key === mode) ?? plan?.options[0];
  // `hasBus` only means a bus leg was found; the prediction behind it may still
  // be a timetable entry rather than a live vehicle.
  const hasRealTime = plan?.options.some((option) => option.isLive) ?? false;
  // Any option that fell back to straight lines means the street router was
  // unreachable, which changes what the footnote can honestly claim.
  const allPrecise = plan?.options.every((option) => option.isPrecise) ?? false;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={13} color={colors.muted} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerOverline}>Route to</Text>
        <Text style={styles.headerTitle}>{spot.name}</Text>
        <Text style={styles.headerSub}>From {location.label} · leaving now</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading && !plan ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.faint} />
            <Text style={styles.loadingText}>Checking Madison Metro…</Text>
          </View>
        ) : null}

        {plan?.options.map((option) => {
          const active = option.key === mode;
          return (
            <Pressable
              key={option.key}
              onPress={() => setMode(option.key)}
              style={[styles.card, active && styles.cardActive]}
            >
              <View style={styles.cardRow}>
                <View style={[styles.modeBadge, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as never} size={15} color="#fff" />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardHead}>
                    <Text style={styles.time}>{option.time}</Text>
                    <Text style={styles.arrive}>{option.arrive}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    {option.isLive ? <View style={styles.liveDot} /> : null}
                    <Text style={styles.summary} numberOfLines={2}>
                      {option.summary}
                    </Text>
                  </View>
                </View>

                {option.tag ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{option.tag}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.preview, active && styles.previewActive]}>
                <MapErrorBoundary label={`${option.key} preview`}>
                  <RouteMap option={option} compact />
                </MapErrorBoundary>
              </View>

              {active ? (
                <View style={styles.legs}>
                  {option.legs.map((leg, index) => (
                    <View key={`${leg.text}-${index}`} style={styles.leg}>
                      <Ionicons
                        name={leg.icon as never}
                        size={11}
                        color={option.color}
                        style={styles.legIcon}
                      />
                      <Text style={styles.legText}>{leg.text}</Text>
                      <Text style={styles.legDur}>{leg.dur}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <View style={styles.note}>
          <Ionicons name="cellular" size={11} color={colors.green} style={styles.noteIcon} />
          <Text style={styles.noteText}>
            {[
              !plan?.hasBus
                ? "No single bus connects these two points right now, so only walking and biking are shown."
                : hasRealTime
                  ? "Metro departures are real-time and refresh every 20 seconds."
                  : "Metro departures are from the timetable — no real-time prediction for this trip yet.",
              allPrecise
                ? "Walking and cycling times follow the actual streets and paths."
                : "The route service is unreachable, so some times and lines are estimated straight-line.",
              location.isFallback
                ? `Routing from ${location.label} — location is unavailable, so distances are from campus rather than from you.`
                : null
            ]
              .filter(Boolean)
              .join(" ")}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.start, !chosen && styles.startDisabled]}
          disabled={!chosen}
          onPress={() => router.push(`/nav/${spot.id}?mode=${chosen?.key ?? "walk"}`)}
        >
          <Text style={styles.startText}>
            {chosen ? `Start · ${startLabel(chosen.key, chosen.time)}` : "Finding routes…"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function startLabel(mode: TravelMode, time: string): string {
  if (mode === "bus") return `Bus, ${time}`;
  if (mode === "bike") return `BCycle, ${time}`;
  return `Walk, ${time}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  missing: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    padding: 40
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10
  },
  backText: {
    fontFamily: fonts.semi,
    fontSize: 13.5,
    color: colors.muted
  },
  headerOverline: overline,
  headerTitle: {
    fontFamily: fonts.displayS,
    fontSize: 20,
    color: colors.ink,
    marginTop: 4
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.faint,
    marginTop: 3
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 11
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
    justifyContent: "center"
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.faint
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  cardActive: {
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  modeBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  cardBody: {
    flex: 1,
    minWidth: 0
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  time: {
    fontFamily: fonts.displayS,
    fontSize: 19,
    color: colors.ink
  },
  arrive: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.faint
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green
  },
  summary: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted
  },
  tag: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted
  },
  // Every card carries its own map so the three options can be compared at a
  // glance; the selected one gets a taller preview.
  preview: {
    height: 96,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border
  },
  previewActive: {
    height: 132
  },
  legs: {
    marginTop: 11,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed"
  },
  leg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 7
  },
  legIcon: {
    width: 16,
    textAlign: "center"
  },
  legText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted
  },
  legDur: {
    fontFamily: fonts.semi,
    fontSize: 11.5,
    color: colors.faint
  },
  note: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingHorizontal: 4,
    paddingTop: 2
  },
  noteIcon: {
    marginTop: 3
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.faint
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22
  },
  start: {
    backgroundColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center"
  },
  startDisabled: {
    backgroundColor: colors.disabled
  },
  startText: {
    fontFamily: fonts.semi,
    fontSize: 15,
    color: "#fff"
  }
});
