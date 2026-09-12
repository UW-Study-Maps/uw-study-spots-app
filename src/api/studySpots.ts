import Constants from "expo-constants";

import type { Spot } from "@/types/spot";

/**
 * Client for the website's backend (`uw-study-spots-map`, Cloudflare Pages
 * Functions + KV) — the public "Updates" log, live crowd-busyness status and
 * reporting, issue-report and spot-suggestion submission, live spot-data
 * overrides, and batch transit-time estimates. Spot ids are kept in sync with
 * that repo's `data.js`, which is what these endpoints validate against. See
 * `functions/api/log.js`, `busyness.js`, `busyness-all.js`, `feedback.js`,
 * `suggest-spot.js`, `spots.js`, and `transit-time.js`.
 *
 * There is no default: unlike Valhalla's public demo server, this backend has
 * no well-known public instance, so a missing `EXPO_PUBLIC_STUDY_SPOTS_API_URL`
 * (see .env.example) means these features are simply unavailable, the same way
 * a missing Transit key just hides the bus option.
 */
const REQUEST_TIMEOUT_MS = 8000;

export type UpdateLogEntryType = "feedback" | "suggestion" | "announcement";

export interface UpdateLogEntry {
  type: UpdateLogEntryType;
  /** Spot name (feedback), suggested spot name (suggestion), or headline (announcement). */
  summary: string;
  originalMessage: string;
  /** The owner's reply, written from the dashboard. */
  response: string;
  ts: number;
}

/** The backend's own busyness vocabulary — distinct from this app's `CrowdLevel`. */
export type ApiBusynessLevel = "empty" | "some-seats" | "busy" | "full";

export interface BusynessStatus {
  level: ApiBusynessLevel | null;
  /** Timestamp of the newest report factored into `level`; null when there are none. */
  reportedAt: number | null;
  recentCount: number;
  /** True when recent reports disagree by 2+ levels — the UI should say so, not hide it. */
  mixed: boolean;
}

export type BusynessReportResult =
  | ({ ok: true } & BusynessStatus)
  | { ok: false; error: "rate_limited"; retryAfterMs: number }
  | { ok: false; error: string };

export type FeedbackIssueType = "wrong-address" | "closed" | "wrong-hours" | "other";

export interface FeedbackInput {
  spotId: string;
  spotName: string;
  issueType: FeedbackIssueType;
  message: string;
  deviceId: string;
}

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export class StudySpotsNotConfiguredError extends Error {
  constructor() {
    super("No study spots API URL configured");
    this.name = "StudySpotsNotConfiguredError";
  }
}

function baseUrl(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_STUDY_SPOTS_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromConfig = Constants.expoConfig?.extra?.studySpotsApiUrl;
  return typeof fromConfig === "string" && fromConfig ? fromConfig.replace(/\/$/, "") : undefined;
}

async function fetchWithTimeout(path: string, init?: RequestInit): Promise<Response> {
  const base = baseUrl();
  if (!base) throw new StudySpotsNotConfiguredError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${base}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchUpdateLog(): Promise<UpdateLogEntry[]> {
  const res = await fetchWithTimeout("/api/log");
  if (!res.ok) throw new Error(`Update log request failed: ${res.status}`);
  const data = (await res.json()) as { entries?: UpdateLogEntry[] };
  return data.entries ?? [];
}

/** Every spot's live busyness at once — the app's equivalent of the website's "Least busy" sort fetch. */
export async function fetchBusynessAll(): Promise<Record<string, BusynessStatus>> {
  const res = await fetchWithTimeout("/api/busyness-all");
  if (!res.ok) throw new Error(`Busyness request failed: ${res.status}`);
  const data = (await res.json()) as { statuses?: Record<string, BusynessStatus> };
  return data.statuses ?? {};
}

/** One spot's freshest busyness — used when its detail sheet opens, same as the website's drawer refresh. */
export async function fetchBusyness(spotId: string): Promise<BusynessStatus> {
  const res = await fetchWithTimeout(`/api/busyness?spotId=${encodeURIComponent(spotId)}`);
  if (!res.ok) throw new Error(`Busyness request failed: ${res.status}`);
  return (await res.json()) as BusynessStatus;
}

export async function postBusynessReport(
  spotId: string,
  level: ApiBusynessLevel,
  deviceId: string
): Promise<BusynessReportResult> {
  const res = await fetchWithTimeout("/api/busyness", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spotId, level, deviceId })
  });
  return (await res.json()) as BusynessReportResult;
}

export async function postFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const res = await fetchWithTimeout("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  return (await res.json()) as FeedbackResult;
}

export type SuggestCategory =
  | "Library"
  | "Student Union"
  | "Academic Building"
  | "Outdoor"
  | "Dining Hall"
  | "Coffee Shop"
  | "Other"
  | "";

export interface SuggestionInput {
  name: string;
  location: string;
  category: SuggestCategory;
  description: string;
  deviceId: string;
}

export type SuggestionResult = { ok: true } | { ok: false; error: string };

export async function postSuggestion(input: SuggestionInput): Promise<SuggestionResult> {
  const res = await fetchWithTimeout("/api/suggest-spot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  return (await res.json()) as SuggestionResult;
}

export interface TransitTimesResult {
  /** Minutes per spot id — the faster of a straight walk or a live single-bus trip. */
  minutes: Record<string, number>;
  /** False when TRANSIT_API_KEY isn't configured server-side — walking estimates only. */
  live: boolean;
}

/** Every spot's travel time from one origin at once — backs the app's "Transit time" sort. */
export async function fetchTransitTimes(origin: { lat: number; lng: number }): Promise<TransitTimesResult> {
  const res = await fetchWithTimeout("/api/transit-time", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ origin })
  });
  if (!res.ok) throw new Error(`Transit-time request failed: ${res.status}`);
  const data = (await res.json()) as { minutes?: Record<string, number>; live?: boolean };
  return { minutes: data.minutes ?? {}, live: Boolean(data.live) };
}

interface SpotOverrideRecord {
  id: string;
  name?: string;
  category?: string;
  address?: string;
  tags?: string[];
  description?: string;
}

/**
 * Live spot-data corrections made via the website's `/dashboard-edit` — name,
 * address, category, tags, description. Coordinates are never overridden (the
 * dashboard editor never writes them), so `lat`/`lng` are left alone.
 * Keyed by spot id; a spot with no override simply won't appear in the map.
 */
export async function fetchSpotOverrides(): Promise<Record<string, Partial<Spot>>> {
  const res = await fetchWithTimeout("/api/spots");
  if (!res.ok) throw new Error(`Spots request failed: ${res.status}`);
  const data = (await res.json()) as { spots?: SpotOverrideRecord[] };

  const overrides: Record<string, Partial<Spot>> = {};
  for (const record of data.spots ?? []) {
    const override: Partial<Spot> = {};
    if (record.name) override.name = record.name;
    if (record.address) override.address = record.address;
    if (record.category) override.cat = record.category as Spot["cat"];
    if (record.tags) override.tags = record.tags;
    if (record.description) override.desc = record.description;
    if (Object.keys(override).length > 0) overrides[record.id] = override;
  }
  return overrides;
}
