import React from "react";
import { FaTrash, FaPowerOff, FaVideo, FaVideoSlash } from "react-icons/fa";

const CameraCard = ({ camera, onToggleStatus, onDelete }) => {
  const isOnline = camera.status === "online" && camera.isActive;

  // FastAPI live MJPEG feed endpoint
  const streamUrl = `http://localhost:8000/api/cameras/${camera._id}/stream`;

  return (
    <div className="glass-card" style={{ overflow: "hidden", position: "relative" }}>
      {/* Header status bar */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-color)",
          background: "rgba(15, 23, 42, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isOnline ? (
            <span
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "var(--success)",
                borderRadius: "50%",
                boxShadow: "0 0 8px var(--success)",
              }}
            />
          ) : (
            <span
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "var(--text-muted)",
                borderRadius: "50%",
              }}
            />
          )}
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{camera.name}</span>
        </div>

        {/* Badges / Type */}
        <span
          style={{
            fontSize: "11px",
            backgroundColor: "var(--bg-hover)",
            padding: "4px 8px",
            borderRadius: "4px",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {camera.type}
        </span>
      </div>

      {/* Camera Video Content Panel */}
      <div
        style={{
          aspectRatio: "16/9",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {isOnline ? (
          <img
            src={streamUrl}
            alt={camera.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              // If loading fails (e.g. OpenCV backend offline), show custom fallback
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fb = parent.querySelector(".mjpeg-fallback");
                if (fb) fb.style.display = "flex";
              }
            }}
          />
        ) : null}

        {/* Offline Fallback Element */}
        <div
          className="mjpeg-fallback"
          style={{
            display: !isOnline ? "flex" : "none",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            color: "var(--text-muted)",
          }}
        >
          <FaVideoSlash style={{ fontSize: "40px" }} />
          <span style={{ fontSize: "14px", fontWeight: 550 }}>
            {!camera.isActive ? "CAMERA DISABLED" : "FEED OFFLINE"}
          </span>
        </div>
      </div>

      {/* Footer controls panel */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--border-color)",
          background: "rgba(15, 23, 42, 0.2)",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Source: {camera.url.length > 20 ? `${camera.url.substring(0, 20)}...` : camera.url}
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
          {/* Toggle Active Button */}
          <button
            onClick={() => onToggleStatus(camera)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              backgroundColor: camera.isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: camera.isActive ? "var(--success)" : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
            }}
            title={camera.isActive ? "Disable Camera" : "Enable Camera"}
          >
            <FaPowerOff />
            {camera.isActive ? "Active" : "Inactive"}
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(camera._id)}
            style={{
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.borderColor = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
            title="Delete Camera"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;
