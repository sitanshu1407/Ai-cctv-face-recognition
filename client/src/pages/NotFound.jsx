import React from "react";
import { Link } from "react-router-dom";
import { BiErrorCircle } from "react-icons/bi";

const NotFound = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <BiErrorCircle style={{ fontSize: "80px", color: "var(--danger)", marginBottom: "24px" }} />
      <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>Channel Error 404</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "28px", maxWidth: "460px" }}>
        The request location does not exist in the security interface routing tree.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
