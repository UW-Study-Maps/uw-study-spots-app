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

import { fetchUpdateLog } from "@/api/studySpots";
import { ST } from "@/data/categories";
import { useDeviceLocation, type DeviceLocation } from "@/lib/useDeviceLocation";
import type { CrowdLevel, NoiseLevel, OutletLevel, SpotReport, StatusMeta } from "@/types/spot";
import type { Spot } from "@/types/spot";

const SAVED_KEY = "uw-study-spots-saved";
const ONBOARD_KEY = "uw-study-spots-onboarded";
const UPDATE_SEEN_KEY = "uw-study-spots-last-seen-update";

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

  /** True once a fresher "Updates" log entry exists than the last one seen. */
  hasNewUpdate: boolean;
  /** Call once the Updates screen has loaded the log, to clear the badge. */
  markUpdatesSeen: (latestTs: number) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Record<string, SpotReport>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const location = useDeviceLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saved, seen] = await AsyncStorage.multiGet([SAVED_KEY, ONBOARD_KEY]);
        if (cancelled) return;
        const parsed = saved[1] ? (JSON.parse(saved[1]) as string[]) : [];
        setSavedIds(Array.isArray(parsed) ? parsed : []);
        setOnboarded(seen[1] === "1");
      } catch {
        // A first run, cleared storage, or corrupt JSON all mean "start fresh"
        // rather than "fail" — the defaults above are already correct.
      } finally {
        if (!cancelled) setHydrated(true);
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

  const markUpdatesSeen = useCallback((latestTs: number) => {
    setHasNewUpdate(false);
    AsyncStorage.setItem(UPDATE_SEEN_KEY, String(latestTs)).catch(() => {});
  }, []);

  // One-shot check on launch, mirroring the website's checkForNewUpdate() —
  // no polling, just "is there something newer than what this device last saw."
  // Silently does nothing if the API isn't configured or unreachable.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const [entries, seenRaw] = await Promise.all([
          fetchUpdateLog(),
          AsyncStorage.getItem(UPDATE_SEEN_KEY)
        ]);
        if (cancelled || !entries.length) return;
        const lastSeen = Number(seenRaw) || 0;
        if (entries[0].ts > lastSeen) setHasNewUpdate(true);
      } catch {
        // Not configured, offline, or the request timed out — no badge either way.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

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
      showToast,
      hasNewUpdate,
      markUpdatesSeen
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
      showToast,
      hasNewUpdate,
      markUpdatesSeen
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
