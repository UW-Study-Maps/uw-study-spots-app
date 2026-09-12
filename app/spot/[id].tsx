import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FeedbackSection } from "@/components/FeedbackSection";
import { CAT } from "@/data/categories";
import { formatRelativeTime } from "@/lib/formatDateTime";
import { walkLabel } from "@/lib/routes";
import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getSpot,
    statusOf,
    isSaved,
    toggleSaved,
    reports,
    location,
    liveBusyness,
    refreshBusyness
  } = useAppState();
  const entrance = useSheetEntrance();

  // Freshest single-spot read, same as the website's drawer-open refresh —
  // the batched fetch on app launch can be a few minutes stale by now.
  useEffect(() => {
    if (id) refreshBusyness(id);
  }, [id, refreshBusyness]);

  const spot = getSpot(id);
  if (!spot) {
    return (
      <Pressable style={styles.backdrop} onPress={() => router.back()}>
        <View style={styles.sheet}>
          <Text style={styles.notFound}>That spot no longer exists.</Text>
        </View>
      </Pressable>
    );
  }

  const cat = CAT[spot.cat];
  const status = statusOf(spot);
  const report = reports[spot.id];
  const live = liveBusyness[spot.id];
  const saved = isSaved(spot.id);
  // Not a structured field — every spot carries one of these two as a tag,
  // same as the website's raw data, which the app already mirrors that way.
  const isOffCampus = spot.tags.includes("Off-Campus");

  const statusMeta = report
    ? "your report, just now"
    : live?.level && live.reportedAt
      ? `${formatRelativeTime(live.reportedAt)} · ${live.recentCount} ${live.recentCount === 1 ? "report" : "reports"}`
      : "be the first to check in";

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <Animated.View style={[styles.sheet, entrance]}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headRow}>
            <View style={[styles.hero, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon as never} size={17} color="#fff" />
            </View>
            <View style={styles.headBody}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: `${cat.color}18` }]}>
                  <Text style={[styles.badgeText, { color: cat.color }]}>
                    {spot.cat.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isOffCampus ? `${colors.brown}18` : `${colors.blue}18` }
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: isOffCampus ? colors.brown : colors.blue }]}
                  >
                    {isOffCampus ? "OFF-CAMPUS" : "UNIVERSITY"}
                  </Text>
                </View>
              </View>
              <Text style={styles.name}>{spot.name}</Text>
              <Text style={styles.address}>{spot.address}</Text>
            </View>
            <Pressable
              onPress={() => toggleSaved(spot.id)}
              style={[styles.saveBtn, saved && styles.saveBtnActive]}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={14}
                color={saved ? colors.uwRed : colors.faint}
              />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push(`/routes/${spot.id}`)}
            >
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.primaryBtnText}>Get there · {walkLabel(location.origin, spot)}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push(`/report/${spot.id}`)}
            >
              <Text style={styles.secondaryBtnText}>Report</Text>
            </Pressable>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>How busy is it right now?</Text>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={styles.statusText}>
                <Text style={styles.statusStrong}>{status.label}</Text>
                <Text style={styles.statusMeta}> · {statusMeta}</Text>
              </Text>
            </View>

            {live?.mixed ? (
              <View style={styles.mixedNote}>
                <Ionicons name="shuffle" size={11} color={colors.faint} />
                <Text style={styles.mixedNoteText}>
                  Recent reports disagree — this is a blended estimate.
                </Text>
              </View>
            ) : null}

            <View style={styles.facts}>
              <View style={styles.fact}>
                <Ionicons name="volume-low" size={12} color={colors.faint} />
                <Text style={styles.factText}>{report?.noise ?? spot.noise}</Text>
              </View>
              <View style={styles.fact}>
                <Ionicons name="flash" size={12} color={colors.faint} />
                <Text style={styles.factText}>{report?.outlets ?? spot.outlets}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.desc}>{spot.desc}</Text>

          <View style={styles.tags}>
            {spot.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <FeedbackSection spotId={spot.id} spotName={spot.name} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(29,26,23,0.34)"
  },
  sheet: {
    maxHeight: "82%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 34
  },
  notFound: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
    padding: 30,
    textAlign: "center"
  },
  headRow: {
    flexDirection: "row",
    gap: 13,
    alignItems: "flex-start"
  },
  hero: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  headBody: {
    flex: 1,
    minWidth: 0
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.6
  },
  name: {
    fontFamily: fonts.displayS,
    fontSize: 21,
    lineHeight: 28,
    color: colors.ink,
    marginTop: 7,
    marginBottom: 5
  },
  address: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  saveBtnActive: {
    backgroundColor: colors.uwRedTint
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
    marginBottom: 18
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 13
  },
  primaryBtnText: {
    fontFamily: fonts.semi,
    fontSize: 14,
    lineHeight: 18,
    color: "#fff"
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  secondaryBtnText: {
    fontFamily: fonts.semi,
    fontSize: 13.5,
    lineHeight: 17,
    color: colors.muted
  },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 15
  },
  panelTitle: {
    ...overline,
    marginBottom: 10
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 11
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  statusText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 17
  },
  statusStrong: {
    fontFamily: fonts.semi,
    color: colors.ink
  },
  statusMeta: {
    fontFamily: fonts.body,
    color: colors.faint
  },
  mixedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  mixedNoteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.faint
  },
  facts: {
    flexDirection: "row",
    gap: 16,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed"
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  factText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 15,
    color: colors.muted
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 22,
    color: colors.ink,
    marginTop: 16,
    marginBottom: 14
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  tag: {
    fontFamily: fonts.semi,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.muted,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    overflow: "hidden"
  }
});
