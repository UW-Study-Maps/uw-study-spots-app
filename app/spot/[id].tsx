import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CAT, CROWD_ORDER } from "@/data/categories";
import { getSpot } from "@/data/spots";
import { walkLabel } from "@/lib/routes";
import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";

const BAR_HEIGHT = 36;

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { statusOf, isSaved, toggleSaved, reports, location } = useAppState();
  const entrance = useSheetEntrance();

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
  const saved = isSaved(spot.id);
  const totalVotes = spot.votes.reduce((a, b) => a + b, 0);
  const peakVotes = Math.max(1, ...spot.votes);

  const statusMeta = report
    ? "your report, just now"
    : spot.age
      ? `${spot.age} · ${totalVotes} ${totalVotes === 1 ? "report" : "reports"} today`
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
              <View style={[styles.badge, { backgroundColor: `${cat.color}18` }]}>
                <Text style={[styles.badgeText, { color: cat.color }]}>
                  {spot.cat.toUpperCase()}
                </Text>
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

            <View style={styles.bars}>
              {CROWD_ORDER.map((level, index) => {
                const votes = spot.votes[index];
                const isCurrent = status.n === index;
                return (
                  <View key={level} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(6, Math.round((votes / peakVotes) * BAR_HEIGHT)),
                            backgroundColor: isCurrent ? status.color : colors.barIdle
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>
                      {level === "some" ? "Some" : level[0].toUpperCase() + level.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>

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
  bars: {
    flexDirection: "row",
    gap: 6
  },
  barCol: {
    flex: 1
  },
  barTrack: {
    height: BAR_HEIGHT,
    backgroundColor: colors.border,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  barFill: {
    width: "100%"
  },
  barLabel: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    lineHeight: 12,
    color: colors.faint,
    textAlign: "center",
    marginTop: 5
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
