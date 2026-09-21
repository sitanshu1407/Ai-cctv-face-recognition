const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folders exist
const dirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "faces"),
  path.join(__dirname, "uploads", "alerts"),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Define Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cameras", require("./routes/cameraRoutes"));
app.use("/api/faces", require("./routes/faceRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/reports", require("./routes/reportsRoutes"));

// Root endpoint
app.get("/", (req, res) => {
  res.send("Smart Home Security System API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
