/**
 * globalActor.ts — Single shared actor instance for the entire app.
 *
 * Created ONCE at module load time, before any React component renders.
 * Both LandingPage and RegisterPage import from here, so they share the
 * exact same actor promise — no duplicate initialization, no stale refs.
 */
import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

let _actorPromise: Promise<backendInterface> | null = null;
let _cached: backendInterface | null = null;

function startActorPromise(): Promise<backendInterface> {
  const p = createActorWithConfig().then((actor) => {
    _cached = actor;
    return actor;
  });
  p.catch(() => {
    // allow retry on failure
    if (_actorPromise === p) _actorPromise = null;
  });
  return p;
}

/** Get the actor (cached after first success). Creates it if not yet started. */
export function getGlobalActor(): Promise<backendInterface> {
  if (_cached) return Promise.resolve(_cached);
  if (!_actorPromise) _actorPromise = startActorPromise();
  return _actorPromise;
}

/** Reset the cache (call before retry after network error). */
export function resetGlobalActor(): void {
  _cached = null;
  _actorPromise = null;
}

/** Get actor with automatic retries (up to 6). Shows meaningful errors. */
export async function getActorWithRetry(): Promise<backendInterface> {
  const delays = [0, 1000, 2000, 3000, 4000, 5000];
  let lastErr: unknown;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) {
      resetGlobalActor();
      await new Promise((r) => setTimeout(r, delays[i]));
    }
    try {
      return await getGlobalActor();
    } catch (err) {
      lastErr = err;
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(
    msg.includes("fetch") || msg.includes("network")
      ? "Network error. Please check your connection and try again."
      : "Could not connect to the server. Please refresh and try again.",
  );
}

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

// Kick off the first connection attempt immediately at module load
getGlobalActor().catch(() => {});
