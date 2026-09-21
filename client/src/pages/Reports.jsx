import React, { useState, useEffect } from "react";
import { FaFilePdf, FaFileExcel, FaFileCsv } from "react-icons/fa";
import API from "../services/api";
import Loader from "../components/Loader";

const Reports = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    camera: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await API.get("/cameras");
        if (response.data && response.data.success) {
          setCameras(response.data.data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch camera list for report filters.");
      } finally {
        setLoading(false);
      }
    };
    fetchCameras();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownload = async (format) => {
    setError("");
    setDownloading(format);

    try {
      const response = await API.get(`/reports/${format}`, {
        params: filters,
        responseType: "blob", // Important for handling binary downloads
      });

      // Map file extension
      let ext = format;
      if (format === "excel") ext = "xlsx";

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `security_report_${Date.now()}.${ext}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(`Failed to generate and download the ${format.toUpperCase()} report.`);
    } finally {
      setDownloading("");
    }
  };

  if (loading) {
    return <Loader message="Accessing report systems..." />;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="glass-card" style={{ padding: "32px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Generate System Incident Reports</h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "28px" }}>
          Filter log data and export high-quality security digests in PDF, Excel or CSV format.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--danger-glow)",
              border: "1px solid var(--danger)",
              borderRadius: "6px",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {/* Camera Filter */}
          <div className="form-group">
            <label className="form-label" htmlFor="camera">
              Filter by Camera
            </label>
            <select
              id="camera"
              name="camera"
              className="form-input"
              value={filters.camera}
              onChange={handleChange}
            >
              <option value="">All Channels</option>
              {cameras.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Reviewed Status
            </label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="">All Records</option>
              <option value="unread">Unread / Active</option>
              <option value="read">Reviewed</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {/* Start Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="startDate">
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={handleChange}
            />
          </div>

          {/* End Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="endDate">
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Exporters Button Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* PDF */}
          <button
            onClick={() => handleDownload("pdf")}
            className="btn btn-primary"
            style={{
              padding: "14px",
              backgroundColor: "#ef4444",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
            }}
            disabled={!!downloading}
          >
            <FaFilePdf style={{ fontSize: "16px" }} />
            {downloading === "pdf" ? "Compiling PDF..." : "Export Official PDF Digest"}
          </button>

          {/* Excel */}
          <button
            onClick={() => handleDownload("excel")}
            className="btn btn-primary"
            style={{
              padding: "14px",
              backgroundColor: "#22c55e",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
            }}
            disabled={!!downloading}
          >
            <FaFileExcel style={{ fontSize: "16px" }} />
            {downloading === "excel" ? "Formatting Excel..." : "Export Excel Spreadsheet"}
          </button>

          {/* CSV */}
          <button
            onClick={() => handleDownload("csv")}
            className="btn btn-secondary"
            style={{ padding: "14px" }}
            disabled={!!downloading}
          >
            <FaFileCsv style={{ fontSize: "16px" }} />
            {downloading === "csv" ? "Writing CSV..." : "Export Standard CSV Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;