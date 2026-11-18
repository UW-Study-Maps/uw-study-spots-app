import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { FALLBACK_ORIGIN } from "@/data/spots";
import type { LatLng } from "@/lib/polyline";

export type LocationStatus = "pending" | "granted" | "denied" | "unavailable";

export interface DeviceLocation {
  /** Where routes start from — the device's position, or the campus fallback. */
  origin: LatLng;
  status: LocationStatus;
  /** True while the fallback is standing in for a real fix. */
  isFallback: boolean;
  /** Human label for the origin, e.g. "Your location". */
  label: string;
  /** Prompts for permission if needed, then takes a fix. Safe to call twice. */
  request: () => Promise<void>;
}

/**
 * The device's position, with a campus fallback.
 *
 * On mount this only *checks* existing permission — it never prompts. The OS
 * dialog is triggered by `request()`, which onboarding calls behind its own
 * explanation of why the app wants location; prompting at launch would put the
 * system dialog in front of the user before anything had explained it.
 *
 * A refusal or a failed fix is never fatal: every screen needs somewhere to
 * plan from, so the app falls back to Union South and says so.
 */
export function useDeviceLocation(): DeviceLocation {
  const [origin, setOrigin] = useState<LatLng>(FALLBACK_ORIGIN);
  const [status, setStatus] = useState<LocationStatus>("pending");

  const readPosition = useCallback(async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
      setStatus("granted");
    } catch {
      // Services off, or no fix available indoors.
      setStatus("unavailable");
      setOrigin(FALLBACK_ORIGIN);
    }
  }, []);

  // Already-granted users get their position without ever seeing a dialog.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (granted) await readPosition();
        else setStatus("denied");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readPosition]);

  const request = useCallback(async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setStatus("denied");
        setOrigin(FALLBACK_ORIGIN);
        return;
      }
      await readPosition();
    } catch {
      setStatus("unavailable");
      setOrigin(FALLBACK_ORIGIN);
    }
  }, [readPosition]);

  const isFallback = status !== "granted";

  return {
    origin,
    status,
    isFallback,
    label: isFallback ? FALLBACK_ORIGIN.label : "Your location",
    request
  };
}
