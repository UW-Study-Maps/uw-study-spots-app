import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFraunces
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInter
} from "@expo-google-fonts/inter";

/**
 * Loads the two families the design uses. Returns false until both are ready
 * so the root layout can hold the splash screen rather than flashing a
 * fallback face.
 */
export function useAppFonts(): boolean {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold, Fraunces_700Bold });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  });
  return frauncesLoaded && interLoaded;
}
