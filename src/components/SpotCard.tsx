import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CAT } from "@/data/categories";
import { walkLabel } from "@/lib/routes";
import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";
import type { Spot } from "@/types/spot";

interface Props {
  spot: Spot;
  /** Compact mode drops the description, per the design's density setting. */
  dense?: boolean;
  onPress: (spot: Spot) => void;
}

export function SpotCard({ spot, dense = false, onPress }: Props) {
  const { statusOf, location } = useAppState();
  const cat = CAT[spot.cat];
  const status = statusOf(spot);

  return (
    <Pressable
      onPress={() => onPress(spot)}
      style={[styles.card, { borderLeftColor: cat.color }, dense && styles.cardDense]}
    >
      <View style={[styles.iconWrap, { backgroundColor: cat.color }]}>
        <Ionicons name={cat.icon as never} size={15} color="#fff" />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {spot.name}
          </Text>
          <Text style={styles.walk}>{walkLabel(location.origin, spot)}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: status.color }]}>
            <Text style={styles.statusPillText}>{status.label}</Text>
          </View>
          <Text style={styles.statusAge} numberOfLines={1}>
            {spot.age || "be the first to check in"}
          </Text>
        </View>

        {dense ? null : (
          <Text style={styles.desc} numberOfLines={2}>
            {spot.desc}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  cardDense: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    flex: 1,
    minWidth: 0
  },
  topRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.displayS,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink
  },
  walk: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.faint
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#fff"
  },
  statusAge: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.faint
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 12.4,
    lineHeight: 18.5,
    color: colors.muted,
    marginTop: 7
  }
});
