import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts } from "@/theme";

/**
 * Solid category pill — fills with the category's own color when active.
 */
export function CategoryPill({
  label,
  color,
  active,
  onPress
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        active ? { backgroundColor: color, borderColor: color } : null
      ]}
    >
      <Text style={[styles.pillLabel, active ? styles.pillLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Dashed tag chip — a lighter filter than the category pills, so it stays
 * outlined rather than filled when active.
 */
export function TagChip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Large selectable option used by the report sheet. Tints toward `color` when
 * active, or to the neutral panel when the option has no color of its own.
 */
export function OptionButton({
  label,
  icon,
  color,
  active,
  onPress
}: {
  label: string;
  icon?: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  const activeBorder = color ?? colors.ink;
  // `color + "14"` is the design's 8% tint of the accent over white.
  const activeBg = color ? `${color}14` : colors.panel;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        active
          ? { borderColor: activeBorder, backgroundColor: activeBg }
          : { borderColor: colors.border, backgroundColor: colors.surface }
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon as never}
          size={13}
          color={active ? activeBorder : colors.muted}
        />
      ) : null}
      <Text style={[styles.optionLabel, { color: active ? activeBorder : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  pillLabel: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.muted
  },
  pillLabelActive: {
    color: "#fff"
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 1
  },
  chipIdle: {
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: "transparent"
  },
  chipActive: {
    borderStyle: "solid",
    borderColor: colors.uwRed,
    backgroundColor: colors.uwRedTint
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.muted
  },
  chipLabelActive: {
    fontFamily: fonts.semi,
    color: colors.uwRedDeep
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5
  },
  optionLabel: {
    fontFamily: fonts.semi,
    fontSize: 12.5,
    lineHeight: 16,
    textAlign: "center"
  }
});
