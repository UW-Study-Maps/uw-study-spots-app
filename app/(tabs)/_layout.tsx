import { Ionicons } from "@expo/vector-icons";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.uwRed,
        tabBarInactiveTintColor: colors.textMuted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Spots",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          headerRight: () => (
            <Link href="/suggest" asChild>
              <Pressable hitSlop={8} style={{ marginRight: 16 }}>
                <Ionicons name="add-circle-outline" size={24} color={colors.uwRed} />
              </Pressable>
            </Link>
          )
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
