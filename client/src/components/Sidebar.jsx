import React from "react";
import { NavLink } from "react-router-dom";
import { 
  MdDashboard, 
  MdSettings, 
  MdSupervisorAccount 
} from "react-icons/md";
import { FaCamera, FaUserPlus } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { HiDocumentReport } from "react-icons/hi";
import { Shield } from "react-icons/fi";

const Sidebar = () => {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <MdDashboard /> },
    { name: "Cameras", path: "/cameras", icon: <FaCamera /> },
    { name: "Face Registry", path: "/face-registration", icon: <FaUserPlus /> },
    { name: "Alerts Log", path: "/alerts", icon: <FiAlertTriangle /> },
    { name: "Reports", path: "/reports", icon: <HiDocumentReport /> },
    { name: "Settings", path: "/settings", icon: <MdSettings /> },
  ];

  return (
    <div
      style={{
        width: "260px",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--primary-glow)",
            color: "var(--primary)",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-active)",
          }}
        >
          <MdSupervisorAccount style={{ fontSize: "24px" }} />
        </div>
        <div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              background: "linear-gradient(to right, #f8fafc, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SECURE-AI
          </h1>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
            SMART HOME INC.
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--primary)" : "transparent",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 550,
              transition: "all var(--transition-fast)",
            })}
            className={({ isActive }) => (isActive ? "" : "sidebar-link-hover")}
          >
            <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>
              {item.icon}
            </span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          AD
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600 }}>Admin User</p>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Host Connection</span>
        </div>
      </div>

      <style>{`
        .sidebar-link-hover:hover {
          background-color: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
