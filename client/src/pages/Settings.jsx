import React, { useState, useEffect } from "react";
import { FaLock, FaSlidersH, FaSave } from "react-icons/fa";
import API from "../services/api";

const Settings = () => {
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // AI config state
  const [aiForm, setAiForm] = useState({
    recognition_threshold: 0.55,
    intruder_timer: 5.0,
  });
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch current AI settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get("/auth/settings");
        if (response.data && response.data.success) {
          setAiForm({
            recognition_threshold: response.data.data.recognition_threshold || 0.55,
            intruder_timer: response.data.data.intruder_timer || 5.0,
          });
        }
      } catch (err) {
        console.error("Failed to load AI system settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await API.put("/auth/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.data && response.data.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAiChange = (e) => {
    setAiForm({ ...aiForm, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    setAiError("");
    setAiSuccess("");
    setAiLoading(true);

    try {
      const response = await API.post("/auth/settings", aiForm);
      if (response.data && response.data.success) {
        setAiSuccess("AI Service configurations updated!");
      }
    } catch (err) {
      console.error(err);
      setAiError(err.response?.data?.message || "Failed to update AI parameters.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
      {/* Change Password Form */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <FaLock style={{ color: "var(--primary)", fontSize: "18px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Security Authentication</h3>
        </div>

        {passwordError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--danger-glow)",
              border: "1px solid var(--danger)",
              borderRadius: "6px",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--success-glow)",
              border: "1px solid var(--success)",
              borderRadius: "6px",
              color: "var(--success)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="oldPassword">
              Current Password
            </label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              className="form-input"
              value={passwordForm.oldPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              disabled={passwordLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-input"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              disabled={passwordLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              disabled={passwordLoading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={passwordLoading}>
            <FaSave /> {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* AI Configurations Form */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <FaSlidersH style={{ color: "var(--primary)", fontSize: "18px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>AI Parameters Calibration</h3>
        </div>

        {aiError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--danger-glow)",
              border: "1px solid var(--danger)",
              borderRadius: "6px",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {aiError}
          </div>
        )}

        {aiSuccess && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--success-glow)",
              border: "1px solid var(--success)",
              borderRadius: "6px",
              color: "var(--success)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {aiSuccess}
          </div>
        )}

        <form onSubmit={handleAiSubmit}>
          {/* Recognition threshold slider */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <label className="form-label" htmlFor="recognition_threshold" style={{ margin: 0 }}>
                Face Recognition Threshold
              </label>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>
                {aiForm.recognition_threshold.toFixed(2)}
              </span>
            </div>
            <input
              id="recognition_threshold"
              name="recognition_threshold"
              type="range"
              min="0.30"
              max="0.85"
              step="0.05"
              className="form-input"
              style={{ padding: 0 }}
              value={aiForm.recognition_threshold}
              onChange={handleAiChange}
              disabled={aiLoading}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
              Higher values reduce false positives but might miss faces. Recommended: 0.55 - 0.65.
            </span>
          </div>

          {/* Intruder timer number input */}
          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label className="form-label" htmlFor="intruder_timer">
              Intruder Alert Timer (Seconds)
            </label>
            <input
              id="intruder_timer"
              name="intruder_timer"
              type="number"
              min="2"
              max="60"
              className="form-input"
              value={aiForm.intruder_timer}
              onChange={handleAiChange}
              required
              disabled={aiLoading}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
              Trigger an alarm if an unknown person is detected continuously for this long.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={aiLoading}>
            <FaSave /> {aiLoading ? "Calibrating..." : "Apply Configurations"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;