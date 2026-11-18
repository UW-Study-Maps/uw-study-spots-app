import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Animated, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useSheetEntrance } from "@/lib/useSheetEntrance";
import { useAppState } from "@/state/appState";
import { colors, fonts } from "@/theme";

const BUCKYGRADES_URL = "https://buckygrades.com/study/";

export default function AboutScreen() {
  const router = useRouter();
  const { spots } = useAppState();
  const entrance = useSheetEntrance();

  function dismiss() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <Animated.View style={[styles.sheet, entrance]}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>About this map</Text>
          <Pressable
            style={styles.close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={dismiss}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.body}>
            <Text style={styles.bodyStrong}>{spots.length}</Text> hand-picked spots across campus
            and Madison. Pin locations are approximate — confirm exact rooms via the building
            directory. Sourced from the UW–Madison Libraries directory, the Wisconsin Union, and
            student-submitted spots via{" "}
            <Text style={styles.link} onPress={() => Linking.openURL(BUCKYGRADES_URL)}>
              BuckyGrades
            </Text>
            .
          </Text>
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6
  },
  title: {
    fontFamily: fonts.displayS,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 34
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  },
  bodyStrong: {
    fontFamily: fonts.semi,
    color: colors.ink
  },
  link: {
    fontFamily: fonts.semi,
    color: colors.uwRedDeep,
    textDecorationLine: "underline"
  }
});
