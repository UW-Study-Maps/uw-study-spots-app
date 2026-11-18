import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";

/** Confirmation toast, pinned just above the tab bar as in the design. */
export function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <View style={styles.toast} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={15} color={colors.green} />
      <Text style={styles.text}>{toast}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    zIndex: 120,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: "#fff"
  }
});
