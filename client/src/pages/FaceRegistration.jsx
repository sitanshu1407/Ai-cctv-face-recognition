import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaUserPlus, FaCamera, FaUpload, FaTimes } from "react-icons/fa";
import API from "../services/api";
import Loader from "../components/Loader";

const FaceRegistration = () => {
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [method, setMethod] = useState("upload"); // "upload" or "camera"
  const [files, setFiles] = useState([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]); // Base64 data URLs
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fetchFaces = async () => {
    try {
      const response = await API.get("/faces");
      if (response.data && response.data.success) {
        setFaces(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load registered profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaces();
    return () => {
      stopWebcam();
    };
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Browser Webcam activation
  const startWebcam = async () => {
    setError("");
    setWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Could not access browser camera. Check permissions.");
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImages([...capturedImages, dataUrl]);
    }
  };

  // Convert Base64 dataURL to Blob for multer
  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please provide the person's name.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);

    if (method === "upload") {
      if (files.length === 0) {
        setError("Please select at least one reference photo.");
        return;
      }
      files.forEach((file) => formData.append("images", file));
    } else {
      if (capturedImages.length === 0) {
        setError("Please capture at least one snapshot.");
        return;
      }
      capturedImages.forEach((dataUrl, idx) => {
        const blob = dataURLtoBlob(dataUrl);
        formData.append("images", blob, `${name.toLowerCase()}-${idx}.jpg`);
      });
    }

    setSubmitLoading(true);

    try {
      const response = await API.post("/faces", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        setSuccess("Person registered successfully!");
        setName("");
        setFiles([]);
        setCapturedImages([]);
        stopWebcam();
        fetchFaces();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to register profile.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFace = async (id) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      try {
        const response = await API.delete(`/faces/${id}`);
        if (response.data && response.data.success) {
          fetchFaces();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return <Loader message="Opening biometric data registry..." />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }}>
      {/* Registration Form Panel */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Register Family Profile</h3>

        {error && (
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
            {error}
          </div>
        )}

        {success && (
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
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Person's Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              disabled={submitLoading}
            />
          </div>

          {/* Toggle Capture Method */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">Capture Method</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  fontSize: "13px",
                  padding: "10px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: method === "upload" ? "var(--primary-glow)" : "transparent",
                  color: method === "upload" ? "var(--primary)" : "var(--text-secondary)",
                  borderColor: method === "upload" ? "var(--primary)" : "var(--border-color)",
                }}
                onClick={() => {
                  setMethod("upload");
                  stopWebcam();
                }}
                disabled={submitLoading}
              >
                <FaUpload /> File Upload
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  fontSize: "13px",
                  padding: "10px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: method === "camera" ? "var(--primary-glow)" : "transparent",
                  color: method === "camera" ? "var(--primary)" : "var(--text-secondary)",
                  borderColor: method === "camera" ? "var(--primary)" : "var(--border-color)",
                }}
                onClick={() => {
                  setMethod("camera");
                  startWebcam();
                }}
                disabled={submitLoading}
              >
                <FaCamera /> Webcam Snap
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          {method === "upload" ? (
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label" htmlFor="images">
                Reference Photo
              </label>
              <input
                id="images"
                type="file"
                className="form-input"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                disabled={submitLoading}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
                Upload clear frontal photos of the person. Up to 5 files.
              </span>
            </div>
          ) : (
            /* Webcam Snapshot Section */
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label">Live Camera Snapshots</label>
              {webcamActive ? (
                <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)", position: "relative" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", transform: "scaleX(-1)" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="btn btn-primary"
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    >
                      Turn Off
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startWebcam}
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "12px" }}
                  disabled={submitLoading}
                >
                  Start Camera Feed
                </button>
              )}

              {/* Snapshot previews */}
              {capturedImages.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Captured Snapshots ({capturedImages.length})
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                    {capturedImages.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid var(--border-color)",
                          position: "relative",
                        }}
                      >
                        <img src={img} alt="snap preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => setCapturedImages(capturedImages.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            padding: "2px",
                            border: "none",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "var(--danger)",
                            cursor: "pointer",
                            fontSize: "10px",
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitLoading}>
            <FaUserShield /> {submitLoading ? "Analyzing Face..." : "Register Biometrics"}
          </button>
        </form>
      </div>

      {/* Registered Faces List Panel */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Registered Profiles</h3>

        {faces.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No registered profiles found. Register your first member using the form.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {faces.map((face) => {
              // Get thumbnail path
              const thumbUrl = face.images && face.images.length > 0 ? `http://localhost:5000/${face.images[0]}` : "";
              return (
                <div
                  key={face._id}
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.25)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <div style={{ width: "100%", aspectRatio: "1/1", backgroundColor: "#000" }}>
                    {thumbUrl && (
                      <img src={thumbUrl} alt={face.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {face.name}
                      </p>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {new Date(face.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteFace(face._id)}
                      style={{
                        padding: "6px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      title="Delete profile"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRegistration;
