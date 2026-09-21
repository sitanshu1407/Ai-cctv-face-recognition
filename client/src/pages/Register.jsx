import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BiShieldQuarter } from "react-icons/bi";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import API from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // Password strength
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLevel = getStrength(formData.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#f43f5e", "#f59e0b", "#3b82f6", "#10b981"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.data && response.data.token) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Glow Spheres */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%)",
          top: "-10%",
          left: "10%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
          bottom: "5%",
          right: "10%",
          pointerEvents: "none",
        }}
      />

      {/* Main Card */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "40px 36px",
          zIndex: 1,
          animation: "fadeIn 0.5s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid var(--border-active)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              marginBottom: "14px",
              boxShadow: "0 0 20px var(--primary-glow)",
            }}
          >
            <BiShieldQuarter />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, textAlign: "center", marginBottom: "4px" }}>
            Create Admin Account
          </h2>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Secure AI Portal Management
          </span>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid var(--success)",
              borderRadius: "10px",
              color: "var(--success)",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "20px",
            }}
          >
            <FaCheckCircle />
            Registration successful! Redirecting to login...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--danger-glow)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              color: "var(--danger)",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "20px",
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "15px",
                  pointerEvents: "none",
                }}
              >
                <FaUser />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                className="form-input"
                style={{ paddingLeft: "40px" }}
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                disabled={loading || success}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "15px",
                  pointerEvents: "none",
                }}
              >
                <FaEnvelope />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: "40px" }}
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                disabled={loading || success}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "15px",
                  pointerEvents: "none",
                }}
              >
                <FaLock />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: "40px", paddingRight: "44px" }}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                disabled={loading || success}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "15px",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Password Strength Bar */}
            {formData.password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    marginBottom: "4px",
                  }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
                        background: i <= strengthLevel ? strengthColors[strengthLevel] : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s ease",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: strengthColors[strengthLevel] }}>
                  {strengthLabels[strengthLevel]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "15px",
                  pointerEvents: "none",
                }}
              >
                <FaLock />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className="form-input"
                style={{
                  paddingLeft: "40px",
                  paddingRight: "44px",
                  borderColor:
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "var(--danger)"
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "var(--success)"
                      : undefined,
                }}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                disabled={loading || success}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "15px",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: "20px" }}
            disabled={loading || success}
          >
            {loading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </form>

        {/* Footer link */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.target.style.textDecoration = "none")}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
