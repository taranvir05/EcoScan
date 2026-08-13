const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bbox: {
      x1: { type: Number, default: null },
      y1: { type: Number, default: null },
      x2: { type: Number, default: null },
      y2: { type: Number, default: null },
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  annotatedImage: {
    type: String,
    trim: true,
    default: "",
  },
  detections: {
    type: [detectionSchema],
    default: [],
  },
  totalDetections: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Result = mongoose.models.Result || mongoose.model("Result", resultSchema);
console.log("[DB] Result model initialized");
module.exports = Result;
