import React from "react";
import { BiLoaderAlt } from "react-icons/bi";

const Loader = ({ message = "Loading system..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        width: "100%",
        height: "100%",
        minHeight: "200px",
      }}
    >
      <BiLoaderAlt
        className="animate-spin"
        style={{
          fontSize: "40px",
          color: "var(--primary)",
          marginBottom: "16px",
        }}
      />
      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        {message}
      </span>
    </div>
  );
};

export default Loader;
