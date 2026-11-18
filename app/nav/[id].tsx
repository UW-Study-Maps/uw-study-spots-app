import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { RouteMap } from "@/components/RouteMap";
import { planRoutes } from "@/lib/routes";
import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";
import type { RouteOption, TravelMode } from "@/types/spot";

// How long each leg is "in progress" in this walkthrough. Real navigation
// would advance on location updates; there is no location provider wired up,
// so the design's timed progression stands in.
const STEP_INTERVAL_MS = 6000;

export default function NavScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: TravelMode }>();
  const router = useRouter();
  const { location, getSpot } = useAppState();
  const spot = getSpot(id);

  const [option, setOption] = useState<RouteOption | null>(null);
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    planRoutes(location.origin, spot)
      .then((plan) => {
        if (cancelled) return;
        setOption(plan.options.find((o) => o.key === mode) ?? plan.options[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [spot, mode, location.origin]);

  const legCount = option?.legs.length ?? 0;

  useEffect(() => {
    if (legCount === 0) return;
    timer.current = setInterval(() => {
      setStep((current) => Math.min(legCount - 1, current + 1));
    }, STEP_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [legCount]);

  const arrive = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (spot) router.replace(`/report/${spot.id}?context=arrival`);
  }, [router, spot]);

  if (!spot || !option) {
    return <View style={styles.loadingScreen} />;
  }

  const current = option.legs[Math.min(step, option.legs.length - 1)];
  const remaining = option.legs.length - step;
  // Only a bus leg carrying a real-time prediction earns the live treatment.
  const isLive = option.key === "bus" && option.isLive === true;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Ionicons name={current.icon as never} size={26} color="#fff" />
          <View style={styles.headerBody}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {current.text}
            </Text>
            <Text style={styles.headerSub}>{option.summary}</Text>
          </View>
          <Text style={styles.headerDur}>{current.dur}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.mapWrap}>
        <MapErrorBoundary label="navigation map">
          <RouteMap option={option} progress={step} />
        </MapErrorBoundary>

        <View style={styles.liveBadge}>
          {/*
            "Live" is claimed only where something live backs it: the bus leg
            carries a real-time prediction from the Transit API. Walking and
            biking are distance estimates, so they say so instead.
          */}
          <View style={[styles.liveDot, !isLive && styles.liveDotIdle]} />
          <Text style={styles.liveText}>
            {isLive
              ? `Live · ${option.summary.split(" · ")[0]}`
              : option.key === "bus"
                ? `Scheduled · ${option.summary.split(" · ")[0]}`
                : option.key === "bike"
                  ? "Estimated · BCycle"
                  : "Estimated · walking route"}
          </Text>
        </View>

        <View style={styles.transitBar}>
          <Ionicons name={option.icon as never} size={17} color={option.color} />
          <View style={styles.transitBody}>
            <Text style={styles.transitLine} numberOfLines={1}>
              {option.legs[1]?.text ?? option.legs[0].text}
            </Text>
            <Text style={styles.transitDetail} numberOfLines={1}>
              {remaining > 1 ? `${remaining - 1} more steps` : "Final leg"}
            </Text>
          </View>
          <View style={styles.transitRight}>
            <Text style={styles.transitCountdown}>{option.time}</Text>
            <Text style={styles.transitSource}>
              {option.key === "bus"
                ? isLive
                  ? "Transit API · real-time"
                  : "Transit API · scheduled"
                : option.isPrecise
                  ? "Routed on streets"
                  : "Estimated from distance"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.steps} contentContainerStyle={styles.stepsContent}>
        {option.legs.map((leg, index) => {
          const done = index < step;
          const now = index === step;
          return (
            <View key={`${leg.text}-${index}`} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.stepNode,
                    done && styles.stepNodeDone,
                    now && styles.stepNodeNow
                  ]}
                />
                {index < option.legs.length - 1 ? (
                  <View style={[styles.rail, done && styles.railDone]} />
                ) : null}
              </View>
              <View style={[styles.stepBody, done && styles.stepBodyDone]}>
                <Text style={[styles.stepText, now && styles.stepTextNow]}>{leg.text}</Text>
                <Text style={styles.stepMeta}>
                  {leg.dur}
                  {now ? " · in progress" : done ? " · done" : ""}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
        <View style={styles.footer}>
          <View style={styles.footerBody}>
            <Text style={styles.eta}>{option.time}</Text>
            <Text style={styles.etaMeta} numberOfLines={1}>
              {option.arrive.replace("arrive ", "")} · {option.legs[1]?.text ?? "Walking"}
            </Text>
          </View>
          <Pressable style={styles.skip} onPress={arrive}>
            <Text style={styles.skipText}>Skip ahead</Text>
          </Pressable>
          <Pressable style={styles.end} onPress={() => router.back()}>
            <Text style={styles.endText}>End</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navInk
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.navInk
  },
  headerSafe: {
    backgroundColor: colors.uwRed
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18
  },
  headerBody: {
    flex: 1,
    minWidth: 0
  },
  headerTitle: {
    fontFamily: fonts.displayS,
    fontSize: 21,
    lineHeight: 28,
    color: "#fff"
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3
  },
  headerDur: {
    fontFamily: fonts.displayS,
    fontSize: 24,
    lineHeight: 32,
    color: "#fff"
  },
  mapWrap: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.navLand
  },
  liveBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(29,26,23,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green
  },
  liveDotIdle: {
    backgroundColor: colors.stone
  },
  liveText: {
    fontFamily: fonts.semi,
    fontSize: 11,
    lineHeight: 14,
    color: "#fff"
  },
  transitBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(29,26,23,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14
  },
  transitBody: {
    flex: 1,
    minWidth: 0
  },
  transitLine: {
    fontFamily: fonts.semi,
    fontSize: 13,
    lineHeight: 17,
    color: "#fff"
  },
  transitDetail: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2
  },
  transitRight: {
    alignItems: "flex-end"
  },
  transitCountdown: {
    fontFamily: fonts.semi,
    fontSize: 15,
    lineHeight: 19,
    color: colors.amber
  },
  transitSource: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 13,
    color: "rgba(255,255,255,0.45)"
  },
  steps: {
    maxHeight: 196,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  stepsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4
  },
  stepRow: {
    flexDirection: "row",
    gap: 14
  },
  stepRail: {
    width: 26,
    alignItems: "center"
  },
  stepNode: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.25)"
  },
  stepNodeDone: {
    backgroundColor: colors.green
  },
  stepNodeNow: {
    backgroundColor: "#fff"
  },
  rail: {
    flex: 1,
    width: 2,
    minHeight: 34,
    backgroundColor: "rgba(255,255,255,0.16)"
  },
  railDone: {
    backgroundColor: colors.green
  },
  stepBody: {
    flex: 1,
    paddingBottom: 20
  },
  stepBodyDone: {
    opacity: 0.45
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff"
  },
  stepTextNow: {
    fontFamily: fonts.semi
  },
  stepMeta: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    marginTop: 3
  },
  footerSafe: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)"
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  footerBody: {
    flex: 1,
    minWidth: 0
  },
  eta: {
    fontFamily: fonts.displayS,
    fontSize: 22,
    lineHeight: 29,
    color: "#fff"
  },
  etaMeta: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2
  },
  skip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 14
  },
  skipText: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#fff"
  },
  end: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16
  },
  endText: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.ink
  }
});
