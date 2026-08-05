import Redis from "ioredis";
import { env } from "./env";

export let redis: Redis | null = null;

// Redis is opt-in. Without REDIS_ENABLED=true the app runs in degraded mode:
// rate limiting uses an in-memory store and background queues are skipped.
// This keeps local dev from thrashing against a Redis server that isn't there.
if (!env.REDIS_ENABLED) {
  console.log(
    "ℹ️  Redis disabled (REDIS_ENABLED is not true) — rate limiting is in-memory, background queues are off."
  );
} else {
  // Give up after a handful of attempts instead of reconnecting forever.
  // Returning null from retryStrategy stops ioredis permanently.
  const MAX_RECONNECT_ATTEMPTS = 5;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableOfflineQueue: false, // Fail commands fast rather than buffering them
    retryStrategy: (attempt) =>
      attempt > MAX_RECONNECT_ATTEMPTS ? null : Math.min(attempt * 200, 2000),
  });

  // ioredis emits `error` on every failed attempt. Log the first one per outage
  // so a down Redis produces one line instead of flooding the console.
  let outageLogged = false;

  client.on("error", (err) => {
    if (outageLogged) return;
    outageLogged = true;
    console.warn(`⚠️  Redis unavailable (${err.message}) — continuing without it.`);
  });

  client.on("connect", () => {
    outageLogged = false;
    console.log("✅ Connected to Redis");
  });

  client.on("end", () => {
    console.warn("⚠️  Redis connection closed — running without cache and queues.");
  });

  redis = client;
}
