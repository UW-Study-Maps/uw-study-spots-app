/**
 * Startup tracing, for diagnosing a blank or black screen.
 *
 * Two outputs, because a black screen tells you nothing about which half is
 * broken: every step goes to the console (visible in the Metro terminal) and
 * into an in-memory list that `BootTrace` renders on screen. If the on-screen
 * overlay never appears at all, React is not rendering — a native crash or a
 * bundle that failed to evaluate — which is itself the answer.
 *
 * Remove this file and its call sites once the startup path is trusted.
 */
export interface TraceEntry {
  step: string;
  detail?: string;
  /** Milliseconds since the module first loaded. */
  at: number;
  level: "info" | "error";
}

const START = Date.now();
const entries: TraceEntry[] = [];
const listeners = new Set<() => void>();

let notifyScheduled = false;

/**
 * Listeners are notified on a later tick, never synchronously.
 *
 * `trace()` is called from inside component render functions, and notifying
 * there would call setState on the overlay while React is rendering a
 * different component — which React reports as an error and which can loop.
 * A timeout puts the update safely outside the render pass.
 */
function scheduleNotify() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  setTimeout(() => {
    notifyScheduled = false;
    for (const listener of listeners) listener();
  }, 0);
}

function push(level: TraceEntry["level"], step: string, detail?: string) {
  const entry: TraceEntry = { step, detail, at: Date.now() - START, level };
  entries.push(entry);

  const line = `[boot +${String(entry.at).padStart(5)}ms] ${step}${detail ? ` — ${detail}` : ""}`;
  if (level === "error") console.error(line);
  else console.log(line);

  scheduleNotify();
}

export function trace(step: string, detail?: string) {
  push("info", step, detail);
}

export function traceError(step: string, error: unknown) {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  push("error", step, detail);
}

export function getTrace(): TraceEntry[] {
  return entries;
}

export function subscribeTrace(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Runs `fn`, tracing whether it returned or threw. */
export function traced<T>(step: string, fn: () => T): T {
  try {
    const result = fn();
    trace(step, "ok");
    return result;
  } catch (error) {
    traceError(step, error);
    throw error;
  }
}
