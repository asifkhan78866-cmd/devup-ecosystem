import Redis from "ioredis";
import { env } from "./env";

export let redis: Redis | null = null;

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log("Redis disabled");
} else {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  redis.on("error", (err) => {
    console.warn("Redis Error, continuing without Redis:", err.message);
  });
  
  redis.on("connect", () => console.log("✅ Connected to Redis"));
}
