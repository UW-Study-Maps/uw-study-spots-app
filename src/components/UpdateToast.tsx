import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { UpdateLogEntryType } from "@/api/studySpots";

function tagLabel(type: UpdateLogEntryType): string {
  if (type === "suggestion") return "Suggestion";
  if (type === "announcement") return "Update";
  return "Feedback";
}

/**
 * Proactive preview of a fresh "Updates" log entry — the app's equivalent of
 * the website's `showUpdateToast`. Unlike the generic `Toast`, this doesn't
 * auto-dismiss: it stays until closed or until "View all" is tapped, same as
 * the website's version.
 */
export function UpdateToast() {
  const router = useRouter();
  const { newUpdateEntry, dismissNewUpdate, markUpdatesSeen } = useAppState();
  if (!newUpdateEntry) return null;

  function viewAll() {
    if (newUpdateEntry) markUpdatesSeen(newUpdateEntry.ts);
    router.push("/updates");
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable
          style={styles.close}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={dismissNewUpdate}
        >
          <Ionicons name="close" size={14} color={colors.faint} />
        </Pressable>

        <Text style={styles.tag}>{tagLabel(newUpdateEntry.type)}</Text>
        <Text style={styles.summary} numberOfLines={1}>
          {newUpdateEntry.summary}
        </Text>
        <Text style={styles.response} numberOfLines={2}>
          {newUpdateEntry.response}
        </Text>

        <Pressable style={styles.viewBtn} onPress={viewAll}>
          <Text style={styles.viewBtnText}>View all updates</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingHorizontal: 16,
    zIndex: 200,
    alignItems: "center"
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    paddingRight: 34,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  close: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  tag: {
    ...overline,
    color: colors.uwRedDeep,
    marginBottom: 4
  },
  summary: {
    fontFamily: fonts.semi,
    fontSize: 14.5,
    lineHeight: 19,
    color: colors.ink
  },
  response: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3
  },
  viewBtn: {
    marginTop: 12,
    alignSelf: "flex-start"
  },
  viewBtnText: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.uwRed
  }
});
