import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  postSuggestion,
  StudySpotsNotConfiguredError,
  type SuggestCategory
} from "@/api/studySpots";
import { OptionButton } from "@/components/Chips";
import { getDeviceId } from "@/lib/deviceId";
import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { colors, fonts, overline } from "@/theme";

const CATEGORY_OPTIONS: { key: SuggestCategory; label: string }[] = [
  { key: "", label: "Not sure" },
  { key: "Library", label: "Library" },
  { key: "Student Union", label: "Student Union" },
  { key: "Academic Building", label: "Academic Building" },
  { key: "Outdoor", label: "Outdoor" },
  { key: "Dining Hall", label: "Dining Hall" },
  { key: "Coffee Shop", label: "Coffee Shop" },
  { key: "Other", label: "Other" }
];

type Stage = "form" | "done";

export default function SuggestScreen() {
  const router = useRouter();
  const entrance = useSheetEntrance();

  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<SuggestCategory>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function dismiss() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function submit() {
    if (submitting) return;
    if (!name.trim() || !location.trim()) {
      setError("Please fill in the spot name and location.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      const result = await postSuggestion({
        name: name.trim(),
        location: location.trim(),
        category,
        description: description.trim(),
        deviceId
      });
      if (result.ok) {
        setStage("done");
        return;
      }
      setError(
        result.error === "rate_limited"
          ? "You've submitted a suggestion recently — please wait a bit before sending another."
          : "Something went wrong — please try again."
      );
    } catch (err) {
      setError(
        err instanceof StudySpotsNotConfiguredError
          ? "Suggesting spots isn't available in this build yet."
          : "Couldn't connect — please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <Animated.View style={[styles.sheet, entrance]}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {stage === "done" ? (
            <View style={styles.thanks}>
              <Ionicons name="checkmark-circle" size={26} color={colors.green} />
              <Text style={styles.thanksTitle}>Thanks!</Text>
              <Text style={styles.thanksBody}>We'll take a look.</Text>
              <Pressable style={styles.doneBtn} onPress={dismiss}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Suggest a study spot</Text>
              <Text style={styles.sub}>
                Know a great spot that's missing from the map? Tell us about it.
              </Text>

              <Text style={styles.label}>Spot name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Grainger Hall Atrium"
                placeholderTextColor={colors.faint}
                maxLength={150}
              />

              <Text style={styles.label}>Location / address</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. 975 University Ave, Madison"
                placeholderTextColor={colors.faint}
                maxLength={300}
              />

              <Text style={styles.label}>Category (optional)</Text>
              <View style={styles.grid}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <View key={opt.key} style={styles.cell}>
                    <OptionButton
                      label={opt.label}
                      active={category === opt.key}
                      onPress={() => setCategory(opt.key)}
                    />
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Why it's worth adding (optional)</Text>
              <TextInput
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
                placeholder="Quiet, good outlets, rarely crowded..."
                placeholderTextColor={colors.faint}
                multiline
                maxLength={1000}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={submit}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? "Submitting…" : "Submit suggestion"}
                </Text>
              </Pressable>
            </>
          )}
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
    maxHeight: "88%",
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
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32
  },
  title: {
    fontFamily: fonts.displayS,
    fontSize: 22,
    lineHeight: 29,
    color: colors.ink,
    marginBottom: 4
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.faint,
    marginBottom: 18
  },
  label: {
    ...overline,
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  cell: {
    width: "31%",
    flexGrow: 1,
    flexDirection: "row"
  },
  textarea: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
    textAlignVertical: "top"
  },
  error: {
    marginTop: 14,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.uwRedDeep
  },
  submitBtn: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: colors.uwRed,
    borderRadius: 999,
    paddingVertical: 15
  },
  submitBtnDisabled: {
    backgroundColor: colors.disabled
  },
  submitBtnText: {
    fontFamily: fonts.semi,
    fontSize: 15,
    lineHeight: 19,
    color: "#fff"
  },
  thanks: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 40
  },
  thanksTitle: {
    fontFamily: fonts.displayS,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
    marginTop: 6
  },
  thanksBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.faint
  },
  doneBtn: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 26,
    backgroundColor: colors.ink
  },
  doneBtnText: {
    fontFamily: fonts.semi,
    fontSize: 14,
    lineHeight: 18,
    color: "#fff"
  }
});
