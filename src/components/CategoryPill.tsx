import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme";

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  active: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, icon, color, active, onPress }: Props) {
  const activeColor = color ?? colors.uwRed;

  return (
    <Pressable
      style={[
        styles.pill,
        active && { backgroundColor: activeColor, borderColor: activeColor }
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={14} color={active ? "#fff" : colors.textMuted} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text
  },
  labelActive: {
    color: "#fff"
  }
});
