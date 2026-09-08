import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: colors.uwRed }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="spot/[id]"
          options={{ presentation: "modal", title: "Spot details" }}
        />
        <Stack.Screen
          name="suggest"
          options={{ presentation: "modal", title: "Suggest a spot" }}
        />
      </Stack>
    </>
  );
}
