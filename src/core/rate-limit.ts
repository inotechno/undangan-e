import Redis from "ioredis";
import { env } from "@/core/config";

const MAX_FAILURES = 3;
const DISABLE_MS = 60_000;

let redis: Redis | null = null;
let failures = 0;
let disabledUntil = 0;

type MemEntry = { count: number; reset: number };
const memory = new Map<string, MemEntry>();

function getRedis(): Redis | null {
  if (Date.now() < disabledUntil) return null;
  if (redis) return redis;
  try {
    const client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 800,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      failures += 1;
      if (failures >= MAX_FAILURES) {
        disabledUntil = Date.now() + DISABLE_MS;
        failures = 0;
      }
    });
    redis = client;
    return client;
  } catch {
    disabledUntil = Date.now() + DISABLE_MS;
    return null;
  }
}

function memoryHit(key: string, limit: number, windowSec: number): { ok: boolean; count: number; retryAfter: number } {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset <= now) {
    const reset = now + windowSec * 1000;
    memory.set(key, { count: 1, reset });
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (v.reset <= now) memory.delete(k);
    }
    return { ok: 1 <= limit, count: 1, retryAfter: windowSec };
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    count: entry.count,
    retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
  };
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

/** Fixed-window rate limit per key. Redis sebagai store utama; fallback in-memory bila Redis tak tersedia. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { ok: true, remaining: limit, retryAfter: 0 };
  }

  const client = getRedis();
  if (client) {
    try {
      const redisKey = `rl:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) await client.expire(redisKey, windowSec);
      failures = 0;
      const ok = count <= limit;
      return {
        ok,
        remaining: Math.max(0, limit - count),
        retryAfter: ok ? 0 : Math.max(1, (await client.ttl(redisKey)) || windowSec),
      };
    } catch {
      failures += 1;
      if (failures >= MAX_FAILURES) {
        disabledUntil = Date.now() + DISABLE_MS;
        failures = 0;
      }
    }
  }

  const mem = memoryHit(key, limit, windowSec);
  return {
    ok: mem.ok,
    remaining: Math.max(0, limit - mem.count),
    retryAfter: mem.ok ? 0 : mem.retryAfter,
  };
}
