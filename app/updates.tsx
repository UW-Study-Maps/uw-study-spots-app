import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchUpdateLog, StudySpotsNotConfiguredError, type UpdateLogEntry } from "@/api/studySpots";
import { formatDateTime } from "@/lib/formatDateTime";
import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";

type LoadState = "loading" | "ready" | "empty" | "unconfigured" | "error";

export default function UpdatesScreen() {
  const router = useRouter();
  const { markUpdatesSeen } = useAppState();
  const entrance = useSheetEntrance();

  const [entries, setEntries] = useState<UpdateLogEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  function dismiss() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchUpdateLog();
        if (cancelled) return;
        if (!result.length) {
          setState("empty");
          return;
        }
        setEntries(result);
        setState("ready");
        markUpdatesSeen(result[0].ts);
      } catch (err) {
        if (cancelled) return;
        setState(err instanceof StudySpotsNotConfiguredError ? "unconfigured" : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // markUpdatesSeen is stable (useCallback with no deps) — omitting it here
    // avoids re-fetching every time the badge is cleared.
  }, []);

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <Animated.View style={[styles.sheet, entrance]}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Updates</Text>
          <Pressable
            style={styles.close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={dismiss}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {state === "loading" ? <Text style={styles.status}>Loading updates…</Text> : null}
          {state === "empty" ? (
            <Text style={styles.status}>
              No updates yet — check back after you submit feedback or a suggestion.
            </Text>
          ) : null}
          {state === "unconfigured" ? (
            <Text style={styles.status}>Updates aren't available in this build yet.</Text>
          ) : null}
          {state === "error" ? (
            <Text style={styles.status}>Couldn't load updates — please try again.</Text>
          ) : null}

          {state === "ready"
            ? entries.map((entry, i) => (
                <View key={`${entry.ts}-${i}`} style={styles.entry}>
                  <Text style={styles.entryTag}>
                    {entry.type === "suggestion" ? "Suggestion" : "Feedback"}
                  </Text>
                  <Text style={styles.entrySummary}>{entry.summary}</Text>
                  <Text style={styles.entryResponse}>{entry.response}</Text>
                  <Text style={styles.entryTime}>{formatDateTime(entry.ts)}</Text>
                </View>
              ))
            : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(29,26,23,0.45)"
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: 12
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6
  },
  title: {
    fontFamily: fonts.displayS,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14
  },
  status: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.faint,
    textAlign: "center",
    paddingVertical: 30
  },
  entry: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 14,
    gap: 4
  },
  entryTag: {
    ...overline,
    color: colors.uwRedDeep
  },
  entrySummary: {
    fontFamily: fonts.semi,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink
  },
  entryResponse: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  },
  entryTime: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.faint,
    marginTop: 2
  }
});
