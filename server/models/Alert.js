const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camera",
      required: true,
    },
    personName: {
      type: String,
      default: "Unknown",
    },
    confidence: {
      type: Number,
      default: 0,
    },
    screenshotPath: {
      type: String,
      required: [true, "Screenshot path is required"],
    },
    videoPath: {
      type: String,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
