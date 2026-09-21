import React, { useState } from "react";
import { FaEye, FaCheck, FaTrash, FaVideo, FaTimes } from "react-icons/fa";

const AlertTable = ({ alerts, onMarkRead, onDelete }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return "var(--success)";
    if (conf >= 0.5) return "var(--warning)";
    return "var(--text-muted)";
  };

  return (
    <div>
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Camera</th>
              <th>Detected Face</th>
              <th>Confidence</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No security incidents recorded.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const isUnread = alert.status === "unread";
                return (
                  <tr key={alert._id} style={{ fontWeight: isUnread ? "600" : "normal" }}>
                    <td style={{ color: isUnread ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td>{alert.camera ? alert.camera.name : "Unknown"}</td>
                    <td>
                      <span
                        style={{
                          color: alert.personName === "Unknown" ? "var(--danger)" : "var(--success)",
                          backgroundColor: alert.personName === "Unknown" ? "var(--danger-glow)" : "var(--success-glow)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {alert.personName}
                      </span>
                    </td>
                    <td style={{ color: getConfidenceColor(alert.confidence) }}>
                      {(alert.confidence * 100).toFixed(0)}%
                    </td>
                    <td>
                      <span style={{ color: isUnread ? "var(--warning)" : "var(--text-muted)" }}>
                        {isUnread ? "Unread" : "Reviewed"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        {/* View Media */}
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center" }}
                          title="View Media Capture"
                        >
                          <FaEye />
                        </button>

                        {/* Mark Read */}
                        {isUnread && (
                          <button
                            onClick={() => onMarkRead(alert._id)}
                            className="btn"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "var(--success)",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Mark Reviewed"
                          >
                            <FaCheck />
                          </button>
                        )}

                        {/* Delete Alert */}
                        <button
                          onClick={() => onDelete(alert._id)}
                          className="btn"
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            backgroundColor: "rgba(244, 63, 94, 0.1)",
                            color: "var(--danger)",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Delete Record"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Media Overlay Modal */}
      {selectedAlert && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "24px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "800px",
              width: "100%",
              backgroundColor: "var(--bg-sidebar)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                  Incident Report: {selectedAlert.personName}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Camera: {selectedAlert.camera ? selectedAlert.camera.name : "Unknown"} |{" "}
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Left Column: Screenshot */}
              <div>
                <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Screenshot Capture
                </h4>
                <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <img
                    src={`http://localhost:5000/${selectedAlert.screenshotPath}`}
                    alt="Alert Capture"
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                  />
                </div>
              </div>

              {/* Right Column: Video Playback */}
              <div>
                <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Recorded Video Clip
                </h4>
                {selectedAlert.videoPath ? (
                  <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <video
                      src={`http://localhost:5000/${selectedAlert.videoPath}`}
                      controls
                      autoPlay
                      style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", backgroundColor: "#000" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: "calc(100% - 24px)",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      border: "1px dashed var(--border-color)",
                    }}
                  >
                    <FaVideo style={{ fontSize: "32px", marginBottom: "8px" }} />
                    <span style={{ fontSize: "12px" }}>No video clip recorded.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              {selectedAlert.status === "unread" && (
                <button
                  onClick={() => {
                    onMarkRead(selectedAlert._id);
                    setSelectedAlert(null);
                  }}
                  className="btn btn-primary"
                >
                  Mark Reviewed
                </button>
              )}
              <button onClick={() => setSelectedAlert(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertTable;
