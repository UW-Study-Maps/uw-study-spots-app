import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_META } from "@/data/categories";
import { colors } from "@/theme";
import type { Spot } from "@/types/spot";

interface Props {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

export function SpotCard({ spot, onPress }: Props) {
  const meta = CATEGORY_META[spot.category];

  return (
    <Pressable style={styles.card} onPress={() => onPress(spot)}>
      <View style={[styles.iconWrap, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.icon as any} size={18} color="#fff" />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {spot.name}
          </Text>
          <Text style={styles.category}>{meta.label}</Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={12} color={colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {spot.address}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {spot.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    flex: 1,
    gap: 4
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  category: {
    fontSize: 11,
    color: colors.textMuted
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted
  },
  description: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18
  }
});
