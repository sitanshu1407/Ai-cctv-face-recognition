const mongoose = require("mongoose");

const CameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Camera name is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Camera connection URL or index is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["webcam", "rtsp"],
      default: "webcam",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Camera", CameraSchema);
