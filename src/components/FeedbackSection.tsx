import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { postFeedback, StudySpotsNotConfiguredError, type FeedbackIssueType } from "@/api/studySpots";
import { OptionButton } from "@/components/Chips";
import { getDeviceId } from "@/lib/deviceId";
import { colors, fonts, overline } from "@/theme";

const ISSUE_OPTIONS: { key: FeedbackIssueType; label: string }[] = [
  { key: "wrong-address", label: "Wrong address" },
  { key: "closed", label: "Permanently closed" },
  { key: "wrong-hours", label: "Wrong hours" },
  { key: "other", label: "Other" }
];

type Stage = "collapsed" | "form" | "done";

interface Props {
  spotId: string;
  spotName: string;
}

/**
 * "Report an issue with this listing" — the app's equivalent of the website's
 * feedback block (see uw-study-spots-map's app.js submitFeedback /
 * feedbackFormHtml), posted to the same `/api/feedback` endpoint.
 */
export function FeedbackSection({ spotId, spotName }: Props) {
  const [stage, setStage] = useState<Stage>("collapsed");
  const [issueType, setIssueType] = useState<FeedbackIssueType>("wrong-address");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStage("collapsed");
    setIssueType("wrong-address");
    setMessage("");
    setError(null);
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      const result = await postFeedback({ spotId, spotName, issueType, message, deviceId });
      if (result.ok) {
        setStage("done");
        return;
      }
      setError(
        result.error === "rate_limited"
          ? "You've submitted feedback recently — please wait a bit before sending more."
          : "Something went wrong — please try again."
      );
    } catch (err) {
      setError(
        err instanceof StudySpotsNotConfiguredError
          ? "Reporting issues isn't available in this build yet."
          : "Couldn't connect — please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "done") {
    return (
      <View style={styles.thanks}>
        <Ionicons name="checkmark-circle" size={15} color={colors.green} />
        <Text style={styles.thanksText}>Thanks — we'll take a look!</Text>
      </View>
    );
  }

  if (stage === "collapsed") {
    return (
      <Pressable style={styles.toggle} onPress={() => setStage("form")}>
        <Ionicons name="warning-outline" size={14} color={colors.faint} />
        <Text style={styles.toggleText}>Report an issue with this listing</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.sectionLabel}>What's wrong?</Text>
      <View style={styles.grid}>
        {ISSUE_OPTIONS.map((opt) => (
          <View key={opt.key} style={styles.cell}>
            <OptionButton
              label={opt.label}
              active={issueType === opt.key}
              onPress={() => setIssueType(opt.key)}
            />
          </View>
        ))}
      </View>

      <TextInput
        style={styles.message}
        value={message}
        onChangeText={setMessage}
        placeholder="Add details (optional)"
        placeholderTextColor={colors.faint}
        multiline
        maxLength={1000}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          disabled={submitting}
          onPress={submit}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Submitting…" : "Submit"}</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={reset} disabled={submitting}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed"
  },
  toggleText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.faint
  },
  thanks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed"
  },
  thanksText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.muted
  },
  form: {
    marginTop: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed"
  },
  sectionLabel: {
    ...overline,
    marginBottom: 9
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  cell: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row"
  },
  message: {
    marginTop: 10,
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    textAlignVertical: "top"
  },
  error: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.uwRedDeep
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12
  },
  submitBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 12
  },
  submitBtnDisabled: {
    backgroundColor: colors.disabled
  },
  submitBtnText: {
    fontFamily: fonts.semi,
    fontSize: 13.5,
    lineHeight: 17,
    color: "#fff"
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 6
  },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.faint
  }
});
