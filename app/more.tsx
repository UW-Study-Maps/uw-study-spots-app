import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";

interface MenuItem {
  icon: string;
  label: string;
  path: "/updates" | "/suggest" | "/about";
  badge?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { hasNewUpdate } = useAppState();
  const entrance = useSheetEntrance();

  function dismiss() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const items: MenuItem[] = [
    { icon: "megaphone-outline", label: "Updates", path: "/updates", badge: hasNewUpdate },
    { icon: "add-circle-outline", label: "Suggest a spot", path: "/suggest" },
    { icon: "information-circle-outline", label: "About this map", path: "/about" }
  ];

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <Animated.View style={[styles.sheet, entrance]}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.path}
              style={styles.row}
              onPress={() => router.replace(item.path)}
            >
              <Ionicons name={item.icon as never} size={18} color={colors.muted} />
              <Text style={styles.rowText}>{item.label}</Text>
              {item.badge ? <View style={styles.dot} /> : null}
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(29,26,23,0.34)"
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22
  },
  grabberWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 24
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 19,
    color: colors.ink
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.uwRed
  }
});
