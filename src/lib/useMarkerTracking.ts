import { useEffect, useState } from "react";

// Long enough for the view to lay out and rasterise, short enough that it is
// over before the user can pan.
const SETTLE_MS = 600;

/**
 * `tracksViewChanges` for a custom marker.
 *
 * react-native-maps rasterises a marker's children into a bitmap. Leaving
 * tracking on permanently re-rasterises every marker on every frame of a pan;
 * turning it off too early — or never turning it on — leaves markers blank or
 * half-drawn on Android. So: track briefly, then stop, and track again for a
 * moment whenever the marker's appearance actually changes.
 */
export function useMarkerTracking(dependency: unknown): boolean {
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    setTracking(true);
    const timer = setTimeout(() => setTracking(false), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [dependency]);

  return tracking;
}
