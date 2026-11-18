import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// The design's sheet entrance: 260ms on a sharp decelerating curve.
const DURATION_MS = 260;

/**
 * Slide-up entrance for a bottom sheet.
 *
 * The stack fades the whole overlay in, which brings the dimmed backdrop up
 * evenly; this moves the panel itself so it reads as a sheet rising over the
 * screen rather than a card appearing in place.
 *
 * `useNativeDriver` because only transform is animated, so it runs off the JS
 * thread and survives the sheet doing work on mount.
 */
export function useSheetEntrance() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
      useNativeDriver: true
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return {
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          // Far enough to clear a tall sheet; the curve settles it quickly.
          outputRange: [420, 0]
        })
      }
    ]
  };
}
