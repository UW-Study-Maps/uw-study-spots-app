import { useCallback, useEffect, useRef, useState } from "react";
import type MapView from "react-native-maps";
import type { Details, Region } from "react-native-maps";

import type { DeviceLocation } from "@/lib/useDeviceLocation";

// Long enough to read as the map moving to you, short enough not to be a wait.
const RECENTER_MS = 550;

/**
 * Centres the map on the user once their position arrives.
 *
 * `initialRegion` is read only at mount, and at that point the location fix is
 * still pending — permission has to be checked and a position taken — so the
 * first frame is always the fallback. This moves the camera once the real fix
 * lands.
 *
 * Three things it deliberately does not do:
 *
 * - It does not use the controlled `region` prop. That would re-assert the
 *   centre on every render and fight the user for control of the map.
 * - It does not recentre after the user has panned. Someone looking at a spot
 *   across campus should not have the map yanked back under them because a
 *   position update arrived late.
 * - It does not fire before the map is ready. The fix can easily land first,
 *   and animating a map that has not mounted would silently spend the one
 *   recentre this hook allows itself.
 *
 * Only a real fix counts: on the campus fallback the map is already framed
 * there, so there is nothing to move to.
 */
export function useCenterOnUser(ref: React.RefObject<MapView | null>, location: DeviceLocation) {
  const [ready, setReady] = useState(false);
  const [userMoved, setUserMoved] = useState(false);
  const centered = useRef(false);

  const { status, origin } = location;

  useEffect(() => {
    if (!ready || status !== "granted") return;
    if (centered.current || userMoved) return;

    centered.current = true;
    // Centre only — leaving zoom and the default tilt as they are.
    ref.current?.animateCamera(
      { center: { latitude: origin.lat, longitude: origin.lng } },
      { duration: RECENTER_MS }
    );
  }, [ref, ready, status, origin.lat, origin.lng, userMoved]);

  /** Wire to the map's `onMapReady`. */
  const onMapReady = useCallback(() => setReady(true), []);

  /** Wire to the map's `onRegionChangeComplete`. */
  const onRegionChangeComplete = useCallback((_region: Region, details: Details) => {
    // Only a gesture means the user took over; programmatic moves — this hook's
    // own recentre, the tilt — report isGesture false.
    if (details?.isGesture) setUserMoved(true);
  }, []);

  return { onMapReady, onRegionChangeComplete };
}
