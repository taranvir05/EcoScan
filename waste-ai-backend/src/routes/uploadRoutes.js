const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const protect = require("../middleware/authMiddleware");
const Result = require("../models/Result");

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const normalizeDetections = (payload) => {
  const rawDetections = Array.isArray(payload?.detections) && payload.detections.length > 0
    ? payload.detections
    : payload?.type
      ? [{ type: payload.type, confidence: payload.confidence }]
      : [];

  return rawDetections.map((item) => {
    const label = item?.label || item?.type || payload?.type || "Unknown";
    const bbox = item?.bbox || item?.boundingBox || null;

    return {
      type: label,
      confidence:
        typeof item?.confidence === "number"
          ? item.confidence
          : typeof payload?.confidence === "number"
            ? payload.confidence
            : 0,
      bbox: bbox && typeof bbox === "object"
        ? {
            x1: bbox.x1 ?? bbox.x ?? bbox.left ?? null,
            y1: bbox.y1 ?? bbox.y ?? bbox.top ?? null,
            x2: bbox.x2 ?? bbox.xmax ?? bbox.right ?? null,
            y2: bbox.y2 ?? bbox.ymax ?? bbox.bottom ?? null,
          }
        : undefined,
    };
  });
};

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Upload Route
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    // Send image to Flask AI server
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/detect`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const detection = aiResponse.data;
    const mappedDetections = normalizeDetections(detection);
    const annotatedImage = detection?.annotatedImage || detection?.annotated_image || "";

    // Save result to MongoDB
    const createdResult = await Result.create({
      user: req.user.id,
      image: req.file.path.replace(/\\/g, "/"),
      annotatedImage,
      detections: mappedDetections,
      totalDetections: detection?.totalDetections ?? mappedDetections.length,
    });

    res.status(201).json({
      message: "Upload + Detection successful",
      resultId: createdResult._id,
      detections: createdResult.detections,
      annotatedImage: createdResult.annotatedImage,
      annotated_image: createdResult.annotatedImage,
      totalDetections: createdResult.totalDetections,
    });
  } catch (error) {
    console.log("UPLOAD ERROR:", error.message);

    res.status(500).json({
      message: "Upload failed",
    });
  }
});

module.exports = router;
