import React, { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaTrash, FaPowerOff, FaVideo, FaThLarge,
  FaTh, FaExpand, FaCompress, FaWifi, FaExclamationTriangle,
  FaCircle, FaList
} from "react-icons/fa";
import API from "../services/api";
import Loader from "../components/Loader";

const AI_BASE = "http://localhost:8000";

// ─── CameraFeed Component ──────────────────────────────────────────────────
const CameraFeed = ({ camera, isExpanded, onExpand }) => {
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const imgRef = useRef(null);
  const streamUrl = `${AI_BASE}/api/cameras/${camera._id}/stream`;

  useEffect(() => {
    setStatus("loading");
  }, [camera._id]);

  const handleLoad = () => setStatus("ok");
  const handleError = () => setStatus("error");

  const isLive = camera.isActive && camera.status === "online";

  return (
    <div
      style={{
        position: "relative",
        background: "#070b14",
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${isLive && status === "ok" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: isLive && status === "ok"
          ? "0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 4px 16px rgba(0,0,0,0.4)",
        transition: "border-color 0.3s, box-shadow 0.3s",
        aspectRatio: "16/9",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Video Feed */}
      {isLive ? (
        <>
          {status === "loading" && (
            <div style={overlayStyle}>
              <div style={spinnerStyle} />
              <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "12px" }}>
                Connecting to stream...
              </span>
            </div>
          )}
          {status === "error" && (
            <div style={overlayStyle}>
              <FaExclamationTriangle style={{ color: "var(--danger)", fontSize: "28px" }} />
              <span style={{ color: "var(--danger)", fontSize: "13px", marginTop: "10px", fontWeight: 600 }}>
                Stream unavailable
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
                AI Service may be offline
              </span>
            </div>
          )}
          <img
            ref={imgRef}
            src={streamUrl}
            alt={camera.name}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: status === "error" ? "none" : "block",
              opacity: status === "loading" ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />
        </>
      ) : (
        <div style={overlayStyle}>
          <FaVideo style={{ color: "var(--text-muted)", fontSize: "32px" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "10px" }}>
            {camera.isActive ? "Camera Offline" : "Camera Suspended"}
          </span>
        </div>
      )}

      {/* Top-left: Live badge */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          borderRadius: "6px",
          padding: "3px 8px",
          fontSize: "11px",
          fontWeight: 700,
          color: isLive && status === "ok" ? "var(--success)" : "var(--text-muted)",
          letterSpacing: "0.5px",
        }}
      >
        <FaCircle
          style={{
            fontSize: "7px",
            animation: isLive && status === "ok" ? "pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
        {isLive && status === "ok" ? "LIVE" : "OFFLINE"}
      </div>

      {/* Bottom overlay: Camera name */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "24px 12px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{camera.name}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", marginTop: "1px" }}>
            {camera.url.length > 38 ? camera.url.slice(0, 38) + "…" : camera.url}
          </div>
        </div>
        <button
          onClick={() => onExpand(camera)}
          title={isExpanded ? "Exit Fullscreen" : "Expand"}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            padding: "5px 7px",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
          }}
        >
          {isExpanded ? <FaCompress /> : <FaExpand />}
        </button>
      </div>

      {/* Type badge top-right */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          borderRadius: "6px",
          padding: "3px 8px",
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {camera.type}
      </div>
    </div>
  );
};

// ─── Expanded Modal ────────────────────────────────────────────────────────
const ExpandedModal = ({ camera, onClose }) => {
  const streamUrl = `${AI_BASE}/api/cameras/${camera._id}/stream`;
  const [status, setStatus] = useState("loading");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "#070b14",
          borderRadius: "16px",
          border: "1px solid rgba(99,102,241,0.3)",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(99,102,241,0.15)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(15,23,42,0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaVideo style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 700, fontSize: "15px" }}>{camera.name}</span>
            <span
              style={{
                fontSize: "10px",
                backgroundColor: "rgba(16,185,129,0.15)",
                color: "var(--success)",
                borderRadius: "4px",
                padding: "2px 7px",
                fontWeight: 700,
              }}
            >
              LIVE
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "none",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaCompress /> Close
          </button>
        </div>

        {/* Video */}
        <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
          {status === "loading" && (
            <div style={overlayStyle}>
              <div style={spinnerStyle} />
              <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "12px" }}>
                Connecting to stream...
              </span>
            </div>
          )}
          <img
            src={streamUrl}
            alt={camera.name}
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("error")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: status === "loading" ? 0 : 1,
              transition: "opacity 0.3s",
            }}
          />
        </div>

        {/* Info bar */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            gap: "24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(15,23,42,0.8)",
          }}
        >
          <InfoChip label="URL" value={camera.url} mono />
          <InfoChip label="Type" value={camera.type.toUpperCase()} />
          <InfoChip label="Stream" value={`${AI_BASE}/api/cameras/${camera._id}/stream`} mono />
        </div>
      </div>
    </div>
  );
};

const InfoChip = ({ label, value, mono }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: mono ? "monospace" : undefined }}>{value}</span>
  </div>
);

// ─── Shared styles ─────────────────────────────────────────────────────────
const overlayStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(7,11,20,0.85)",
  zIndex: 1,
};

const spinnerStyle = {
  width: "32px",
  height: "32px",
  border: "3px solid rgba(99,102,241,0.2)",
  borderTopColor: "var(--primary)",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

// ─── Main Cameras Component ────────────────────────────────────────────────
const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");      // "live" | "manage"
  const [gridCols, setGridCols] = useState(2);             // 1, 2, 3, 4
  const [expandedCamera, setExpandedCamera] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: "", url: "", type: "rtsp" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchCameras = async () => {
    try {
      const response = await API.get("/cameras");
      if (response.data?.success) {
        setCameras(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    // Poll camera statuses every 15 seconds
    const interval = setInterval(fetchCameras, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitLoading(true);
    try {
      const response = await API.post("/cameras", form);
      if (response.data?.success) {
        setFormSuccess("Camera registered! Stream will start in a moment.");
        setForm({ name: "", url: "", type: "rtsp" });
        fetchCameras();
        setTimeout(() => setActiveTab("live"), 1500);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create camera channel.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (camera) => {
    try {
      await API.put(`/cameras/${camera._id}`, { isActive: !camera.isActive });
      fetchCameras();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this camera channel?")) {
      try {
        await API.delete(`/cameras/${id}`);
        fetchCameras();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <Loader message="Accessing hardware feeds registry..." />;

  const onlineCameras = cameras.filter((c) => c.isActive && c.status === "online");
  const totalCameras = cameras.length;

  const gridColsMap = {
    1: "1fr",
    2: "1fr 1fr",
    3: "1fr 1fr 1fr",
    4: "1fr 1fr 1fr 1fr",
  };

  return (
    <>
      {/* Expanded Modal */}
      {expandedCamera && (
        <ExpandedModal camera={expandedCamera} onClose={() => setExpandedCamera(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ── Header Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Title + Stats */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>
              Camera Feeds
            </h2>
            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>{onlineCameras.length}</span> online
              </span>
              <span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{totalCameras}</span> total
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Tab Toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(15,23,42,0.7)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "3px",
                gap: "2px",
              }}
            >
              <TabBtn
                active={activeTab === "live"}
                onClick={() => setActiveTab("live")}
                icon={<FaVideo />}
                label="Live View"
              />
              <TabBtn
                active={activeTab === "manage"}
                onClick={() => setActiveTab("manage")}
                icon={<FaList />}
                label="Manage"
              />
            </div>

            {/* Grid size selector (only in live view) */}
            {activeTab === "live" && (
              <div
                style={{
                  display: "flex",
                  background: "rgba(15,23,42,0.7)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "3px",
                  gap: "2px",
                }}
              >
                {[
                  { cols: 1, icon: <FaExpand /> },
                  { cols: 2, icon: <FaThLarge /> },
                  { cols: 3, icon: <FaTh /> },
                  { cols: 4, icon: <FaTh style={{ fontSize: "10px" }} /> },
                ].map(({ cols, icon }) => (
                  <button
                    key={cols}
                    onClick={() => setGridCols(cols)}
                    title={`${cols} column${cols > 1 ? "s" : ""}`}
                    style={{
                      background: gridCols === cols ? "var(--primary)" : "transparent",
                      border: "none",
                      borderRadius: "7px",
                      color: gridCols === cols ? "#fff" : "var(--text-muted)",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {/* Add Camera shortcut */}
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab("manage")}
              style={{ padding: "8px 16px", fontSize: "13px", gap: "6px" }}
            >
              <FaPlus /> Add Camera
            </button>
          </div>
        </div>

        {/* ── LIVE VIEW TAB ── */}
        {activeTab === "live" && (
          <>
            {cameras.length === 0 ? (
              <EmptyState onAdd={() => setActiveTab("manage")} />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridColsMap[gridCols],
                  gap: "16px",
                }}
              >
                {cameras.map((camera) => (
                  <CameraFeed
                    key={camera._id}
                    camera={camera}
                    isExpanded={expandedCamera?._id === camera._id}
                    onExpand={(cam) => setExpandedCamera(cam)}
                  />
                ))}
              </div>
            )}

            {/* Legend */}
            {cameras.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  paddingTop: "4px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                  Live — AI face detection active
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
                  Offline / suspended
                </span>
                <span style={{ marginLeft: "auto" }}>
                  Streams served by AI service at <code style={{ color: "var(--primary)" }}>{AI_BASE}</code>
                </span>
              </div>
            )}
          </>
        )}

        {/* ── MANAGE TAB ── */}
        {activeTab === "manage" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>
            {/* Add Form */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaPlus style={{ color: "var(--primary)", fontSize: "13px" }} /> Connect New Channel
              </h3>

              {formError && <AlertBox type="error" message={formError} />}
              {formSuccess && <AlertBox type="success" message={formSuccess} />}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Camera Nickname</label>
                  <input
                    id="name" name="name" type="text" className="form-input"
                    value={form.name} onChange={handleChange}
                    placeholder="e.g. Front Gate" required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="type">Connection Type</label>
                  <select
                    id="type" name="type" className="form-input"
                    value={form.type} onChange={handleChange}
                    style={{ appearance: "none" }}
                  >
                    <option value="rtsp">Network RTSP / IP Camera</option>
                    <option value="webcam">Local USB Webcam</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "8px" }}>
                  <label className="form-label" htmlFor="url">
                    {form.type === "webcam" ? "Device Index" : "RTSP Stream URL"}
                  </label>
                  <input
                    id="url" name="url" type="text" className="form-input"
                    value={form.url} onChange={handleChange}
                    placeholder={
                      form.type === "webcam"
                        ? "0  (default webcam)"
                        : "rtsp://user:pass@192.168.1.10:554/stream1"
                    }
                    required
                  />
                </div>

                {form.type === "rtsp" && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                    Format: <code style={{ color: "var(--primary)", background: "rgba(99,102,241,0.08)", padding: "1px 4px", borderRadius: "3px" }}>rtsp://username:password@ip:port/path</code>
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={submitLoading}
                >
                  <FaPlus /> {submitLoading ? "Connecting..." : "Add Channel"}
                </button>
              </form>
            </div>

            {/* Camera Table */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaWifi style={{ color: "var(--primary)", fontSize: "13px" }} /> Registered Feeds
              </h3>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Source URL</th>
                      <th>State</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cameras.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                          No camera channels configured yet.
                        </td>
                      </tr>
                    ) : (
                      cameras.map((camera) => (
                        <tr key={camera._id}>
                          <td style={{ fontWeight: 600 }}>{camera.name}</td>
                          <td>
                            <span
                              style={{
                                fontSize: "10px",
                                backgroundColor: "var(--bg-hover)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                              }}
                            >
                              {camera.type}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "11px", maxWidth: "220px" }}>
                            <span title={camera.url}>
                              {camera.url.length > 30 ? camera.url.slice(0, 30) + "…" : camera.url}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: camera.isActive ? "var(--success)" : "var(--text-muted)", fontSize: "13px" }}>
                              {camera.isActive ? "Enabled" : "Disabled"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  width: "7px", height: "7px", borderRadius: "50%",
                                  backgroundColor: camera.status === "online" && camera.isActive ? "var(--success)" : "var(--danger)",
                                  boxShadow: camera.status === "online" && camera.isActive ? "0 0 6px var(--success)" : "none",
                                  animation: camera.status === "online" && camera.isActive ? "pulse 2s infinite" : "none",
                                }}
                              />
                              <span style={{ fontSize: "13px" }}>
                                {camera.isActive ? (camera.status === "online" ? "Online" : "Offline") : "Suspended"}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => { setExpandedCamera(camera); setActiveTab("live"); }}
                                className="btn"
                                title="View Live"
                                style={{
                                  padding: "5px 8px", fontSize: "12px",
                                  backgroundColor: "rgba(99,102,241,0.12)",
                                  color: "var(--primary)",
                                }}
                              >
                                <FaVideo />
                              </button>
                              <button
                                onClick={() => handleToggleActive(camera)}
                                className="btn"
                                title={camera.isActive ? "Deactivate" : "Activate"}
                                style={{
                                  padding: "5px 8px", fontSize: "12px",
                                  backgroundColor: camera.isActive ? "rgba(244,63,94,0.12)" : "rgba(16,185,129,0.12)",
                                  color: camera.isActive ? "var(--danger)" : "var(--success)",
                                }}
                              >
                                <FaPowerOff />
                              </button>
                              <button
                                onClick={() => handleDelete(camera._id)}
                                className="btn"
                                title="Delete"
                                style={{
                                  padding: "5px 8px", fontSize: "12px",
                                  backgroundColor: "rgba(255,255,255,0.04)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Helper components ─────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 14px",
      borderRadius: "7px",
      border: "none",
      background: active ? "var(--primary)" : "transparent",
      color: active ? "#fff" : "var(--text-muted)",
      fontSize: "13px",
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
    }}
  >
    {icon} {label}
  </button>
);

const AlertBox = ({ type, message }) => (
  <div
    style={{
      padding: "10px 14px",
      backgroundColor: type === "error" ? "var(--danger-glow)" : "var(--success-glow)",
      border: `1px solid ${type === "error" ? "var(--danger)" : "var(--success)"}`,
      borderRadius: "8px",
      color: type === "error" ? "var(--danger)" : "var(--success)",
      fontSize: "13px",
      fontWeight: 500,
      marginBottom: "16px",
      lineHeight: 1.4,
    }}
  >
    {message}
  </div>
);

const EmptyState = ({ onAdd }) => (
  <div
    className="glass-card"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 40px",
      gap: "16px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "20px",
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        color: "var(--primary)",
        marginBottom: "8px",
      }}
    >
      <FaVideo />
    </div>
    <h3 style={{ fontSize: "18px", fontWeight: 700 }}>No Camera Feeds</h3>
    <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "320px", lineHeight: 1.6 }}>
      Add your first RTSP camera or USB webcam to start live monitoring with AI face detection.
    </p>
    <button className="btn btn-primary" onClick={onAdd} style={{ marginTop: "8px", gap: "8px" }}>
      <FaPlus /> Add First Camera
    </button>
  </div>
);

export default Cameras;