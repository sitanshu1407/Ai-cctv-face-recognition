import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaVideo, FaUserShield, FaBell, FaExclamationTriangle } from "react-icons/fa";
import API from "../services/api";
import StatCard from "../components/StatCard";
import CameraCard from "../components/CameraCard";
import AlertTable from "../components/AlertTable";
import Loader from "../components/Loader";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      // Fetch system stats
      const statsRes = await API.get("/alerts/statistics");
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Fetch cameras
      const camerasRes = await API.get("/cameras");
      if (camerasRes.data && camerasRes.data.success) {
        setCameras(camerasRes.data.data.filter((cam) => cam.isActive));
      }
      
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data. Please verify servers are running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll stats and alert records every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCameraStatus = async (camera) => {
    try {
      await API.put(`/cameras/${camera._id}`, { isActive: !camera.isActive });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCamera = async (id) => {
    if (window.confirm("Are you sure you want to delete this camera?")) {
      try {
        await API.delete(`/cameras/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAlertRead = async (id) => {
    try {
      await API.put(`/alerts/${id}/read`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (window.confirm("Are you sure you want to delete this alert record?")) {
      try {
        await API.delete(`/alerts/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading && !stats) {
    return <Loader message="Compiling analytics database..." />;
  }

  return (
    <div>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--danger-glow)",
            border: "1px solid var(--danger)",
            borderRadius: "8px",
            color: "var(--danger)",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {/* Grid Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <StatCard
          title="Total Channels"
          value={stats?.cameras.total || 0}
          icon={<FaVideo />}
          color="99, 102, 241"
        />
        <StatCard
          title="Active Feeds"
          value={stats?.cameras.online || 0}
          icon={<FaVideo />}
          color="16, 185, 129"
        />
        <StatCard
          title="Faces Registered"
          value={stats?.faces.total || 0}
          icon={<FaUserShield />}
          color="167, 139, 250"
        />
        <StatCard
          title="Alarms Today"
          value={stats?.alerts.today || 0}
          icon={<FaBell />}
          color="244, 63, 94"
        />
      </div>

      {/* Main Grid: Live streams & Activity Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Live Preview Monitor */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Live Operations View</h3>
            <Link to="/cameras" style={{ color: "var(--primary)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              Manage Channels
            </Link>
          </div>

          {cameras.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <FaVideoSlash style={{ fontSize: "48px", color: "var(--text-muted)" }} />
              <div>
                <p style={{ fontWeight: 600 }}>No cameras connected to the system.</p>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Configure your local webcams or RTSP URLs to start monitoring.
                </span>
              </div>
              <Link to="/cameras" className="btn btn-primary">
                Add Camera Channel
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {cameras.map((cam) => (
                <CameraCard
                  key={cam._id}
                  camera={cam}
                  onToggleStatus={handleToggleCameraStatus}
                  onDelete={handleDeleteCamera}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity Chart panel */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Incident Trends</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Total triggers per day (Past 7 Days)
          </span>

          {/* Bar Chart Representation using CSS */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              height: "180px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-color)",
              gap: "8px",
            }}
          >
            {stats?.chartData.map((data, idx) => {
              const maxVal = Math.max(...stats.chartData.map((d) => d.alerts), 5);
              const heightPct = (data.alerts / maxVal) * 100;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "28px",
                      height: `${Math.max(heightPct, 4)}%`,
                      background: "linear-gradient(to top, var(--primary), #a78bfa)",
                      borderRadius: "6px 6px 0 0",
                      position: "relative",
                      transition: "height 0.5s ease",
                    }}
                    title={`${data.alerts} alerts`}
                  >
                    {data.alerts > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-20px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {data.alerts}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 550 }}>
                    {data.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Alerts Table Snippet */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Critical Alerts Recents</h3>
          <Link to="/alerts" style={{ color: "var(--primary)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            View Full Log
          </Link>
        </div>

        <AlertTable
          alerts={stats?.recentAlerts || []}
          onMarkRead={handleMarkAlertRead}
          onDelete={handleDeleteAlert}
        />
      </div>
    </div>
  );
};

// Internal sub-icon fallback
const FaVideoSlash = ({ style }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" style={style} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M633.82 458.1l-157.8-121.96C511.95 288.75 512 284 512 280v-40c0-10.15-5.99-19.12-15.19-22.95l-92.42-38.51 31.95-63.9c2.39-4.78 1.97-10.49-1.08-14.87L315.65 3.3c-4.46-6.4-14.15-5.91-17.92 1.05L215.1 155.8 45.47 24.37C38.05 18.64 27.22 20 21.3 27.42L3.37 50.15c-5.83 7.37-4.59 18.08 2.78 23.94l573.83 442.27c7.43 5.73 18.17 4.31 23.94-3.13l17.75-22.88c5.82-7.51 4.41-18.19-2.85-23.77zM368 320V192l64 26.67V320h-64zM64 400h256c7.09 0 13.79-2.37 19.34-6.3L64.3 183.05C64.1 184.02 64 185 64 186v214zm448-120l96 80V152l-96 80v48z"></path>
  </svg>
);

export default Dashboard;