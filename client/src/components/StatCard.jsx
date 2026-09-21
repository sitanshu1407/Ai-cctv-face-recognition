import React from "react";

const StatCard = ({ title, value, icon, color = "var(--primary)" }) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
        <h3
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginTop: "8px",
            color: "var(--text-primary)",
          }}
        >
          {value}
        </h3>
      </div>
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: `rgba(${color}, 0.1)`,
          color: `rgb(${color})`,
          border: `1px solid rgba(${color}, 0.25)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
