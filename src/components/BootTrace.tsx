import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { getTrace, subscribeTrace, type TraceEntry } from "@/lib/trace";

/**
 * Startup trace, drawn over the app.
 *
 * Kept to a single line at the bottom unless something went wrong: an overlay
 * large enough to obscure the app is indistinguishable from the blank screen
 * it is meant to diagnose. Errors expand it, because at that point seeing them
 * matters more than seeing the UI underneath.
 *
 * Styled with literal values and no custom fonts, so it still renders when the
 * theme or font loading is the thing that is broken. Dev builds only.
 */
export function BootTrace() {
  const [entries, setEntries] = useState<TraceEntry[]>(() => [...getTrace()]);

  useEffect(() => subscribeTrace(() => setEntries([...getTrace()])), []);

  if (!__DEV__) return null;

  const errors = entries.filter((entry) => entry.level === "error");
  const last = entries[entries.length - 1];

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={[styles.summary, errors.length > 0 && styles.summaryBad]} numberOfLines={1}>
        {`boot ${entries.length} steps`}
        {last ? ` · +${last.at}ms · ${last.step}` : ""}
        {errors.length > 0 ? ` · ${errors.length} error(s)` : ""}
      </Text>

      {errors.length > 0 ? (
        <ScrollView style={styles.errorList}>
          {errors.map((entry, index) => (
            <Text key={index} style={styles.errorLine}>
              {`+${entry.at}ms  ${entry.step}`}
              {entry.detail ? `\n    ${entry.detail}` : ""}
            </Text>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "40%",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    zIndex: 99999
  },
  summary: {
    color: "#7CFF9E",
    fontSize: 9,
    fontFamily: "monospace"
  },
  summaryBad: {
    color: "#FF8A80"
  },
  errorList: {
    flexGrow: 0,
    marginTop: 4
  },
  errorLine: {
    color: "#FF8A80",
    fontSize: 9,
    lineHeight: 13,
    fontFamily: "monospace"
  }
});
