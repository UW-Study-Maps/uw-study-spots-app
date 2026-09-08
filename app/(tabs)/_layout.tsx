import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { trace } from "@/lib/trace";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  trace("(tabs)/_layout render");
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.uwRed,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 10 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
