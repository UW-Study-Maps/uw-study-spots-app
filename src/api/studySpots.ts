import Constants from "expo-constants";

/**
 * Client for the website's backend (`uw-study-spots-map`, Cloudflare Pages
 * Functions + KV) — currently just the public "Updates" log, the feed of
 * owner responses to feedback/suggestions surfaced on the website behind the
 * bullhorn button. See that repo's `functions/api/log.js`.
 *
 * There is no default: unlike Valhalla's public demo server, this backend has
 * no well-known public instance, so a missing `EXPO_PUBLIC_STUDY_SPOTS_API_URL`
 * (see .env.example) means the feature is simply unavailable, the same way a
 * missing Transit key just hides the bus option.
 */
const REQUEST_TIMEOUT_MS = 8000;

export type UpdateLogEntryType = "feedback" | "suggestion";

export interface UpdateLogEntry {
  type: UpdateLogEntryType;
  /** Spot name (feedback) or suggested spot name (suggestion). */
  summary: string;
  originalMessage: string;
  /** The owner's reply, written from the dashboard. */
  response: string;
  ts: number;
}

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

export async function fetchUpdateLog(): Promise<UpdateLogEntry[]> {
  const base = baseUrl();
  if (!base) throw new StudySpotsNotConfiguredError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/log`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Update log request failed: ${res.status}`);
    const data = (await res.json()) as { entries?: UpdateLogEntry[] };
    return data.entries ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
