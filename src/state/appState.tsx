import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { ST } from "@/data/categories";
import { trace, traceError } from "@/lib/trace";
import { useDeviceLocation, type DeviceLocation } from "@/lib/useDeviceLocation";
import type { CrowdLevel, NoiseLevel, OutletLevel, SpotReport, StatusMeta } from "@/types/spot";
import type { Spot } from "@/types/spot";

const SAVED_KEY = "uw-study-spots-saved";
const ONBOARD_KEY = "uw-study-spots-onboarded";

interface AppState {
  /** Device position (or campus fallback) that every route is planned from. */
  location: DeviceLocation;

  /** False until AsyncStorage has been read, so we do not flash onboarding. */
  hydrated: boolean;
  onboarded: boolean;
  finishOnboarding: () => void;

  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;

  /** Reports made this session, overriding a spot's seeded status. */
  reports: Record<string, SpotReport>;
  submitReport: (spotId: string, report: SpotReport) => void;
  /** A spot's current crowding, accounting for any report made this session. */
  statusOf: (spot: Spot) => StatusMeta;

  toast: string | null;
  showToast: (message: string) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  trace("AppStateProvider render");
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Record<string, SpotReport>>({});
  const [toast, setToast] = useState<string | null>(null);
  const location = useDeviceLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        trace("AsyncStorage read start");
        const [saved, seen] = await AsyncStorage.multiGet([SAVED_KEY, ONBOARD_KEY]);
        trace("AsyncStorage read done");
        if (cancelled) return;
        const parsed = saved[1] ? (JSON.parse(saved[1]) as string[]) : [];
        setSavedIds(Array.isArray(parsed) ? parsed : []);
        setOnboarded(seen[1] === "1");
      } catch (error) {
        // A first run, cleared storage, or corrupt JSON all mean "start fresh"
        // rather than "fail" — the defaults above are already correct.
        traceError("AsyncStorage read failed", error);
      } finally {
        if (!cancelled) {
          trace("hydrated");
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARD_KEY, "1").catch(() => {});
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id)
        ? current.filter((s) => s !== id)
        : current.concat(id);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  // One timer for whichever toast is current, cleared on replace or unmount.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const submitReport = useCallback((spotId: string, report: SpotReport) => {
    setReports((current) => ({ ...current, [spotId]: report }));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      location,
      hydrated,
      onboarded,
      finishOnboarding,
      savedIds,
      isSaved: (id) => savedIds.includes(id),
      toggleSaved,
      reports,
      submitReport,
      statusOf: (spot) => ST[reports[spot.id]?.crowd ?? spot.status],
      toast,
      showToast
    }),
    [
      location,
      hydrated,
      onboarded,
      finishOnboarding,
      savedIds,
      toggleSaved,
      reports,
      submitReport,
      toast,
      showToast
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}

export type { CrowdLevel, NoiseLevel, OutletLevel };
