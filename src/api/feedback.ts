import { apiFetch } from "@/api/client";
import type { FeedbackIssueType } from "@/types/spot";

export interface FeedbackInput {
  spotId: string;
  spotName: string;
  issueType: FeedbackIssueType;
  message: string;
  deviceId: string;
}

export function submitFeedback(input: FeedbackInput) {
  return apiFetch<{ ok: boolean; error?: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
