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

import {
  fetchBusyness,
  fetchBusynessAll,
  fetchSpotOverrides,
  fetchUpdateLog,
  postBusynessReport,
  StudySpotsNotConfiguredError,
  type ApiBusynessLevel,
  type BusynessStatus,
  type UpdateLogEntry
} from "@/api/studySpots";
import { ST } from "@/data/categories";
import { SPOTS } from "@/data/spots";
import { getDeviceId } from "@/lib/deviceId";
import { useDeviceLocation, type DeviceLocation } from "@/lib/useDeviceLocation";
import type { CrowdLevel, NoiseLevel, OutletLevel, SpotReport, StatusMeta } from "@/types/spot";
import type { Spot } from "@/types/spot";

const SAVED_KEY = "uw-study-spots-saved";
const ONBOARD_KEY = "uw-study-spots-onboarded";
const UPDATE_SEEN_KEY = "uw-study-spots-last-seen-update";
const REPORT_LOCK_KEY = "uw-study-spots-busyness-lock";

/** Minimum gap between busyness reports from this device for one spot — keep in sync with the backend's RATE_LIMIT_MS. */
const RATE_LIMIT_MS = 20 * 60 * 1000;

/** The backend's busyness vocabulary differs slightly from this app's `CrowdLevel`. */
const CROWD_TO_API: Record<CrowdLevel, ApiBusynessLevel> = {
  empty: "empty",
  some: "some-seats",
  busy: "busy",
  full: "full"
};
const API_TO_CROWD: Record<ApiBusynessLevel, CrowdLevel> = {
  empty: "empty",
  "some-seats": "some",
  busy: "busy",
  full: "full"
};

interface AppState {
  /** Device position (or campus fallback) that every route is planned from. */
  location: DeviceLocation;

  /** False until AsyncStorage has been read, so we do not flash onboarding. */
  hydrated: boolean;
  onboarded: boolean;
  finishOnboarding: () => void;

  /** Bundled SPOTS with any live `/dashboard-edit` corrections merged in. */
  spots: Spot[];
  getSpot: (id: string | undefined) => Spot | undefined;

  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;

  /** Reports made this session, overriding a spot's live status. */
  reports: Record<string, SpotReport>;
  /** Resolves once the backend has accepted (or locally recorded) the report. */
  submitReport: (spotId: string, report: SpotReport) => Promise<{ ok: boolean; error?: string }>;
  /** A spot's current crowding: this session's report, else live backend data, else "no recent reports". */
  statusOf: (spot: Spot) => StatusMeta;

  /** Live busyness per spot from the Cloudflare backend, when reachable. */
  liveBusyness: Record<string, BusynessStatus>;
  /** Refetches one spot's freshest busyness — call when its detail sheet opens. */
  refreshBusyness: (spotId: string) => void;

  /** Timestamp (ms) a spot's report button unlocks again; 0/past means unlocked. */
  reportLockedUntil: (spotId: string) => number;

  toast: string | null;
  showToast: (message: string) => void;

  /** True once a fresher "Updates" log entry exists than the last one seen. */
  hasNewUpdate: boolean;
  /** The fresher entry itself, for a toast preview; null once dismissed or seen. */
  newUpdateEntry: UpdateLogEntry | null;
  dismissNewUpdate: () => void;
  /** Call once the Updates screen has loaded the log, to clear the badge. */
  markUpdatesSeen: (latestTs: number) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [spotOverrides, setSpotOverrides] = useState<Record<string, Partial<Spot>>>({});
  const [reports, setReports] = useState<Record<string, SpotReport>>({});
  const [reportLocks, setReportLocks] = useState<Record<string, number>>({});
  const [liveBusyness, setLiveBusyness] = useState<Record<string, BusynessStatus>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [newUpdateEntry, setNewUpdateEntry] = useState<UpdateLogEntry | null>(null);
  const location = useDeviceLocation();

  const spots = useMemo(
    () =>
      SPOTS.map((spot) =>
        spotOverrides[spot.id] ? { ...spot, ...spotOverrides[spot.id] } : spot
      ),
    [spotOverrides]
  );
  const getSpot = useCallback(
    (id: string | undefined) => spots.find((s) => s.id === id),
    [spots]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saved, seen, locks] = await AsyncStorage.multiGet([
          SAVED_KEY,
          ONBOARD_KEY,
          REPORT_LOCK_KEY
        ]);
        if (cancelled) return;
        const parsed = saved[1] ? (JSON.parse(saved[1]) as string[]) : [];
        setSavedIds(Array.isArray(parsed) ? parsed : []);
        setOnboarded(seen[1] === "1");
        const parsedLocks = locks[1] ? (JSON.parse(locks[1]) as Record<string, number>) : {};
        setReportLocks(parsedLocks && typeof parsedLocks === "object" ? parsedLocks : {});
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

  // Merges in any live `/dashboard-edit` corrections, mirroring the website's
  // own fetch-on-load — the app still works fine on the bundled data if this
  // fails or isn't configured. Coordinates are never part of an override.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetchSpotOverrides()
      .then((overrides) => {
        if (!cancelled) setSpotOverrides(overrides);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

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

  const setLock = useCallback((spotId: string, until: number) => {
    setReportLocks((current) => {
      const next = { ...current, [spotId]: until };
      AsyncStorage.setItem(REPORT_LOCK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reportLockedUntil = useCallback(
    (spotId: string) => reportLocks[spotId] ?? 0,
    [reportLocks]
  );

  const submitReport = useCallback(
    async (spotId: string, report: SpotReport) => {
      try {
        const deviceId = await getDeviceId();
        const result = await postBusynessReport(spotId, CROWD_TO_API[report.crowd], deviceId);
        if (result.ok) {
          setReports((current) => ({ ...current, [spotId]: report }));
          setLiveBusyness((current) => ({
            ...current,
            [spotId]: {
              level: result.level,
              reportedAt: result.reportedAt,
              recentCount: result.recentCount,
              mixed: result.mixed
            }
          }));
          setLock(spotId, Date.now() + RATE_LIMIT_MS);
          return { ok: true };
        }
        if ("retryAfterMs" in result) {
          setLock(spotId, Date.now() + result.retryAfterMs);
          return { ok: false, error: "You've already reported this spot recently — try again later." };
        }
        return { ok: false, error: "Something went wrong — try again." };
      } catch (err) {
        if (err instanceof StudySpotsNotConfiguredError) {
          // No backend configured for this build — the same local-only report
          // this app made before it was wired up.
          setReports((current) => ({ ...current, [spotId]: report }));
          return { ok: true };
        }
        return { ok: false, error: "Couldn't connect — try again." };
      }
    },
    [setLock]
  );

  const refreshBusyness = useCallback((spotId: string) => {
    fetchBusyness(spotId)
      .then((status) => {
        setLiveBusyness((current) => ({ ...current, [spotId]: status }));
      })
      .catch(() => {
        // Not configured, offline, or timed out — whatever the batch fetch
        // already had (or nothing) stands.
      });
  }, []);

  // One batched fetch of every spot's live busyness, mirroring the website's
  // "Least busy" sort call — cheaper than one request per spot, and enough to
  // drive statusOf everywhere in the app. Silently does nothing if the
  // backend isn't configured or unreachable, same as the update-log check.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetchBusynessAll()
      .then((statuses) => {
        if (!cancelled) setLiveBusyness(statuses);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const markUpdatesSeen = useCallback((latestTs: number) => {
    setHasNewUpdate(false);
    setNewUpdateEntry(null);
    AsyncStorage.setItem(UPDATE_SEEN_KEY, String(latestTs)).catch(() => {});
  }, []);

  const dismissNewUpdate = useCallback(() => {
    setNewUpdateEntry(null);
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
        if (entries[0].ts > lastSeen) {
          setHasNewUpdate(true);
          setNewUpdateEntry(entries[0]);
        }
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
      spots,
      getSpot,
      savedIds,
      isSaved: (id) => savedIds.includes(id),
      toggleSaved,
      reports,
      submitReport,
      statusOf: (spot) => {
        const sessionCrowd = reports[spot.id]?.crowd;
        if (sessionCrowd) return ST[sessionCrowd];
        const live = liveBusyness[spot.id];
        if (live?.level) return ST[API_TO_CROWD[live.level]];
        return ST.none;
      },
      liveBusyness,
      refreshBusyness,
      reportLockedUntil,
      toast,
      showToast,
      hasNewUpdate,
      newUpdateEntry,
      dismissNewUpdate,
      markUpdatesSeen
    }),
    [
      location,
      hydrated,
      onboarded,
      finishOnboarding,
      spots,
      getSpot,
      savedIds,
      toggleSaved,
      reports,
      submitReport,
      liveBusyness,
      refreshBusyness,
      reportLockedUntil,
      toast,
      showToast,
      hasNewUpdate,
      newUpdateEntry,
      dismissNewUpdate,
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
