import { apiFetch } from "@/api/client";
import type { BusynessLevel, BusynessStatus } from "@/types/spot";

export function getBusyness(spotId: string): Promise<BusynessStatus> {
  return apiFetch(`/api/busyness?spotId=${encodeURIComponent(spotId)}`);
}

export function reportBusyness(spotId: string, level: BusynessLevel, deviceId: string) {
  return apiFetch<{ ok: boolean; error?: string; retryAfterMs?: number }>("/api/busyness", {
    method: "POST",
    body: JSON.stringify({ spotId, level, deviceId })
  });
}
