const mongoose = require("mongoose");

const FaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Person name is required"],
      trim: true,
      unique: true,
    },
    images: {
      type: [String],
      required: [true, "At least one reference image path is required"],
    },
    embedding: {
      type: [Number],
      required: [true, "Face embedding vector is required"],
      validate: {
        validator: function (v) {
          return v && v.length === 512;
        },
        message: (props) => `Embedding must be exactly 512 dimensions. Got ${props.value ? props.value.length : 0}`,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Face", FaceSchema);
