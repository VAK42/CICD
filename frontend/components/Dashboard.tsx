"use client";
import { Activity, Database, Server, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
interface ServiceHealthInfo {
  status?: string;
  message?: string;
  latencyMs?: number;
  uptimeSeconds?: number;
  memoryUsage?: {
    rssMb?: string;
  };
}
interface AggregatedHealthResponse {
  status?: string;
  services?: {
    server?: ServiceHealthInfo;
    supabase?: ServiceHealthInfo;
    redis?: ServiceHealthInfo;
  };
}
export default function HealthStatusPanel() {
  const [healthData, setHealthData] = useState<AggregatedHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>("");
  const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const backendBaseUrl = rawBackendUrl.replace(/\/+$/, "");
  const fetchHealthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendBaseUrl}/health`);
      const data: AggregatedHealthResponse = await response.json();
      setHealthData(data);
      setLastFetchedTime(new Date().toLocaleTimeString());
    } catch (error) {
      setHealthData({
        status: "Backend Disconnected",
        services: {
          server: { status: "Unreachable", message: "Render Backend Offline" },
          supabase: { status: "Unreachable", message: "Unable To Query Service" },
          redis: { status: "Unreachable", message: "Unable To Query Service" }
        }
      });
      setLastFetchedTime(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchHealthStatus();
    const intervalId = setInterval(fetchHealthStatus, 15000);
    return () => clearInterval(intervalId);
  }, []);
  const getBadgeClass = (status?: string) => {
    if (!status) return "unconfigured";
    const normalized = status.toLowerCase();
    if (normalized === "healthy" || normalized === "online" || normalized === "system operational") return "online";
    if (normalized === "nah configured") return "unconfigured";
    if (normalized === "degraded") return "degraded";
    return "unreachable";
  };
  const getStatusDotClass = (status?: string) => {
    if (!status) return "degraded";
    const normalized = status.toLowerCase();
    if (normalized === "system operational" || normalized === "healthy") return "healthy";
    if (normalized === "service degraded" || normalized === "degraded") return "degraded";
    return "error";
  };
  const serverService = healthData?.services?.server;
  const supabaseService = healthData?.services?.supabase;
  const redisService = healthData?.services?.redis;
  return (
    <div className="healthDashboardCard">
      <div className="healthDashboardHeader" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="healthDashboardHeaderTitle">
          <span className={`statusIndicatorDot ${getStatusDotClass(healthData?.status)}`} />
          <span>System Health Monitor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchHealthStatus();
            }}
            className="actionBtn"
            style={{ padding: "0.25rem 0.5rem", minWidth: "auto" }}
            title="Refresh"
          >
            <RefreshCw size={12} className={isLoading ? "spin" : ""} />
          </button>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>
      {!isCollapsed && (
        <div className="healthDashboardBody">
          <div className="healthServiceItem">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Server size={14} color="var(--textSecondary)" />
              <div>
                <div className="serviceItemName">Express Server</div>
                <div style={{ fontSize: "0.65rem", color: "var(--textSecondary)" }}>
                  {serverService?.uptimeSeconds !== undefined ? `Uptime: ${serverService.uptimeSeconds}s | RSS: ${serverService.memoryUsage?.rssMb} MB` : (serverService?.message || "Render Backend")}
                </div>
              </div>
            </div>
            <span className={`serviceItemBadge ${getBadgeClass(serverService?.status)}`}>
              {serverService?.status || "Checking"}
            </span>
          </div>
          <div className="healthServiceItem">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Database size={14} color="var(--textSecondary)" />
              <div>
                <div className="serviceItemName">Supabase Database</div>
                <div style={{ fontSize: "0.65rem", color: "var(--textSecondary)" }}>
                  {supabaseService?.latencyMs ? `Latency: ${supabaseService.latencyMs}ms | ${supabaseService.message}` : (supabaseService?.message || "PostgreSQL Cluster")}
                </div>
              </div>
            </div>
            <span className={`serviceItemBadge ${getBadgeClass(supabaseService?.status)}`}>
              {supabaseService?.status || "Checking"}
            </span>
          </div>
          <div className="healthServiceItem">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={14} color="var(--textSecondary)" />
              <div>
                <div className="serviceItemName">Upstash Redis</div>
                <div style={{ fontSize: "0.65rem", color: "var(--textSecondary)" }}>
                  {redisService?.latencyMs ? `Latency: ${redisService.latencyMs}ms | ${redisService.message}` : (redisService?.message || "Serverless Cache")}
                </div>
              </div>
            </div>
            <span className={`serviceItemBadge ${getBadgeClass(redisService?.status)}`}>
              {redisService?.status || "Checking"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--textTertiary)", marginTop: "0.25rem" }}>
            <span>Status: {healthData?.status || "Connecting"}</span>
            <span>Checked: {lastFetchedTime || "Never"}</span>
          </div>
        </div>
      )}
    </div>
  )
}