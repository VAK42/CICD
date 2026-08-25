import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
const supabaseUrl = process.env.SupabaseUrl || "";
const supabaseKey = process.env.SupabaseKey || "";
const redisUrl = process.env.UpstashRedisRestUrl || "";
const redisToken = process.env.UpstashRedisRestToken || "";
const supabaseClient = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const redisClient = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
export const checkSelfHealth = () => {
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();
  return {
    status: "Healthy",
    message: "Express Server Active",
    uptimeSeconds,
    memoryUsage: {
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2)
    },
    timestamp: new Date().toISOString()
  };
};
export const checkSupabaseHealth = async () => {
  if (!supabaseClient) {
    return {
      status: "Nah Configured",
      message: "Supabase Credentials Missing",
      latencyMs: 0,
      timestamp: new Date().toISOString()
    };
  }
  const startTime = Date.now();
  try {
    const { error } = await supabaseClient.auth.getSession();
    const latencyMs = Date.now() - startTime;
    if (error) {
      return {
        status: "Degraded",
        message: "Supabase Authentication Error",
        latencyMs,
        timestamp: new Date().toISOString()
      };
    }
    return {
      status: "Healthy",
      message: "Database Connection Active",
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      status: "Unreachable",
      message: "Supabase Network Timeout",
      latencyMs,
      timestamp: new Date().toISOString()
    };
  }
};
export const checkUpstashHealth = async () => {
  if (!redisClient) {
    return {
      status: "Nah Configured",
      message: "Upstash Credentials Missing",
      latencyMs: 0,
      timestamp: new Date().toISOString()
    };
  }
  const startTime = Date.now();
  try {
    const pingResponse = await redisClient.ping();
    const latencyMs = Date.now() - startTime;
    if (pingResponse === "PONG" || pingResponse === "pong" || pingResponse) {
      return {
        status: "Healthy",
        message: "Redis Store Online",
        latencyMs,
        timestamp: new Date().toISOString()
      };
    }
    return {
      status: "Degraded",
      message: "Redis Unexpected Ping Response",
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      status: "Unreachable",
      message: "Redis Network Timeout",
      latencyMs,
      timestamp: new Date().toISOString()
    };
  }
};
export const getAggregatedHealth = async () => {
  const selfHealth = checkSelfHealth();
  const [supabaseHealth, upstashHealth] = await Promise.all([
    checkSupabaseHealth(),
    checkUpstashHealth()
  ]);
  const isHealthy = selfHealth.status === "Healthy" &&
    (supabaseHealth.status === "Healthy" || supabaseHealth.status === "Nah Configured") &&
    (upstashHealth.status === "Healthy" || upstashHealth.status === "Nah Configured");
  return {
    status: isHealthy ? "System Operational" : "Service Degraded",
    timestamp: new Date().toISOString(),
    services: {
      server: selfHealth,
      supabase: supabaseHealth,
      redis: upstashHealth
    }
  };
};