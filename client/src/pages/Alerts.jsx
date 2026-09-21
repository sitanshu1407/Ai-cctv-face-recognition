import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaRedo } from "react-icons/fa";
import API from "../services/api";
import AlertTable from "../components/AlertTable";
import Loader from "../components/Loader";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    camera: "",
    status: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      // 1. Fetch cameras for filter dropdown
      const camsRes = await API.get("/cameras");
      if (camsRes.data && camsRes.data.success) {
        setCameras(camsRes.data.data);
      }

      // 2. Fetch alerts
      const params = {
        camera: filters.camera,
        status: filters.status,
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      };

      const alertsRes = await API.get("/alerts", { params });
      if (alertsRes.data && alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
        setPagination(alertsRes.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch alerts log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.camera, filters.status, filters.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchData();
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleReset = () => {
    setFilters({
      camera: "",
      status: "",
      search: "",
      page: 1,
      limit: 10,
    });
  };

  const handleMarkRead = async (id) => {
    try {
      await API.put(`/alerts/${id}/read`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this security log entry?")) {
      try {
        await API.delete(`/alerts/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  if (loading && alerts.length === 0) {
    return <Loader message="Accessing system incident records..." />;
  }

  return (
    <div>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--danger-glow)",
            border: "1px solid var(--danger)",
            borderRadius: "8px",
            color: "var(--danger)",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          
          {/* Text Search */}
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label className="form-label" htmlFor="search">
              Search Identity
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="search"
                name="search"
                type="text"
                className="form-input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="e.g. Unknown, John"
                style={{ paddingLeft: "40px" }}
              />
              <FaSearch
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
            </div>
          </div>

          {/* Camera Filter */}
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label className="form-label" htmlFor="camera">
              Camera Channel
            </label>
            <select
              id="camera"
              name="camera"
              className="form-input"
              value={filters.camera}
              onChange={handleFilterChange}
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
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label className="form-label" htmlFor="status">
              Reviewed Status
            </label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Records</option>
              <option value="unread">Unread / Active</option>
              <option value="read">Reviewed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary">
              Query
            </button>
            <button type="button" onClick={handleReset} className="btn btn-secondary" title="Reset Filters">
              <FaRedo />
            </button>
          </div>

        </form>
      </div>

      {/* Main Alerts Log Table */}
      <AlertTable alerts={alerts} onMarkRead={handleMarkRead} onDelete={handleDelete} />

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} records)
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "14px" }}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "14px" }}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;