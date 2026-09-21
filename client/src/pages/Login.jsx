import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BiShieldQuarter } from "react-icons/bi";
import API from "../services/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", { username, password });
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify({ username: response.data.username, email: response.data.email }));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials or server connection failed.");
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
      {/* Decorative Glow Background Spheres */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244, 63, 94, 0.05) 0%, transparent 70%)",
          bottom: "10%",
          right: "15%",
        }}
      />

      {/* Main Login Card */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px 32px",
          zIndex: 1,
          animation: "fadeIn 0.5s ease-out",
        }}
      >
        {/* Brand/Logo Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
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
              fontSize: "32px",
              marginBottom: "16px",
              boxShadow: "0 0 16px var(--primary-glow)",
            }}
          >
            <BiShieldQuarter />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, textAlign: "center" }}>Welcome Back</h2>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Secure AI Portal Management
          </span>
        </div>

        {/* Error message */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Authenticating..." : "Access Dashboard"}
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "20px" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
            onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.target.style.textDecoration = "none")}
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;