import { useCallback, useMemo, useRef } from "react";
import type MapView from "react-native-maps";

import { MAP_PITCH } from "@/data/mapStyle";

/**
 * Applies a default camera tilt to a map.
 *
 * Pitch lives on the camera, and setting the `camera` prop makes the map
 * ignore `region` entirely — which would throw away the framing both maps
 * compute for themselves. So the region stays in charge of where the camera
 * looks, and the pitch is nudged in afterwards through `animateCamera`, which
 * leaves centre and zoom alone.
 *
 * `apply` is also exposed for callers whose region changes after mount: moving
 * the camera to a new region can reset the tilt, so it has to be re-asserted.
 */
export function useMapTilt(pitch: number = MAP_PITCH) {
  const ref = useRef<MapView>(null);

  const apply = useCallback(() => {
    // duration 0 so the tilt is simply the starting state, not an animation
    // the user watches happen.
    ref.current?.animateCamera({ pitch }, { duration: 0 });
  }, [pitch]);

  // Memoised: callers put this in effect dependencies, and a fresh object each
  // render would re-tilt the camera on every render.
  return useMemo(() => ({ ref, apply }), [apply]);
}
