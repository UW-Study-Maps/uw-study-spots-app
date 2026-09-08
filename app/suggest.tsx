import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { suggestSpot } from "@/api/suggestSpot";
import { getDeviceId } from "@/lib/deviceId";
import { colors } from "@/theme";

export default function SuggestSpotScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !location.trim()) {
      setError("Please fill in the spot name and location.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const result = await suggestSpot({
        name: name.trim(),
        location: location.trim(),
        category: "",
        description: description.trim(),
        deviceId
      });
      if (result.ok) {
        setDone(true);
      } else if (result.error === "rate_limited") {
        setError("You've submitted a suggestion recently — please wait a bit before sending another.");
      } else {
        setError("Something went wrong — please try again.");
      }
    } catch {
      setError("Couldn't connect — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.thanks}>Thanks! We'll take a look.</Text>
        <Pressable style={styles.submitBtn} onPress={() => router.back()}>
          <Text style={styles.submitText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sub}>Know a great spot that's missing from the map? Tell us about it.</Text>

      <Text style={styles.label}>Spot name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Grainger Hall Atrium"
        maxLength={150}
      />

      <Text style={styles.label}>Location / address</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. 975 University Ave, Madison"
        maxLength={300}
      />

      <Text style={styles.label}>Why it's worth adding (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Quiet, good outlets, rarely crowded..."
        maxLength={1000}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitBtn} disabled={submitting} onPress={handleSubmit}>
        <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit suggestion"}</Text>
      </Pressable>
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
    gap: 6
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  error: {
    color: colors.uwRed,
    fontSize: 13,
    marginTop: 12
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: colors.uwRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15
  },
  thanks: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  }
});
