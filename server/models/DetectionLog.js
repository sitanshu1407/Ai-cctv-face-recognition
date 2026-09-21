const mongoose = require("mongoose");

const DetectionLogSchema = new mongoose.Schema(
  {
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camera",
      required: true,
    },
    personName: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DetectionLog", DetectionLogSchema);
