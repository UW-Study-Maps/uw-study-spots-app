import { apiFetch } from "@/api/client";

export interface SuggestSpotInput {
  name: string;
  location: string;
  category: string;
  description: string;
  deviceId: string;
}

export function suggestSpot(input: SuggestSpotInput) {
  return apiFetch<{ ok: boolean; error?: string }>("/api/suggest-spot", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
