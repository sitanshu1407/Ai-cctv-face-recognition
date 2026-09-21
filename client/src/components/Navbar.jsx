import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiBell } from "react-icons/fi";
import { GoPrimitiveDot } from "react-icons/go";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Resolve Title based on path
  const getTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Operations Overview";
      case "/cameras":
        return "Camera Configurations";
      case "/face-registration":
        return "Family Profile Registry";
      case "/alerts":
        return "Incident Alarm Log";
      case "/reports":
        return "Data Reports Export";
      case "/settings":
        return "System Settings";
      default:
        return "Security Dashboard";
    }
  };

  return (
    <header
      style={{
        height: "70px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(9, 13, 22, 0.4)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Title */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>{getTitle()}</h2>
      </div>

      {/* Info elements */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Clock */}
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 550 }}>
          {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          {" - "}
          {time.toLocaleTimeString()}
        </div>

        {/* Engine status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--success)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "var(--success)",
              borderRadius: "50%",
              display: "inline-block",
              boxShadow: "0 0 8px var(--success)",
            }}
          />
          AI ENGINES ONLINE
        </div>

        {/* Action icons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.borderColor = "var(--danger-glow)";
              e.currentTarget.style.backgroundColor = "var(--danger-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Log Out"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
