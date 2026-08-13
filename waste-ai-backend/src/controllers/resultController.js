const mongoose = require("mongoose");
const Result = require("../models/Result");
const Activity = require("../models/Activity");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { generatePDF } = require("../utils/pdfGenerator");
const User = require("../models/user");

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

const uploadResult = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const normalizedImagePath = req.file.path.replace(/\\/g, "/");
    let mappedDetections = [];
    let aiResponse = null;

    try {
      console.log("=== UPLOAD STARTED ===");
      console.log("Req.file received:", req.file.path);

      // Create form data to send to the AI server
      const formData = new FormData();
      formData.append("image", fs.createReadStream(req.file.path));

      console.log("Sending image to AI server...");
      // Send to Python AI microservice
      aiResponse = await axios.post(`${AI_SERVICE_URL}/detect`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const detection = aiResponse.data;
      console.log("AI Server raw response:", detection);

      if (detection) {
        mappedDetections = normalizeDetections(detection);
      } else {
        console.error("AI Server returned invalid format:", detection);
      }
    } catch (aiError) {
      console.error("=== AI SERVER REQUEST FAILED ===");
      console.error("AI_SERVICE_URL:", AI_SERVICE_URL);
      console.error("Error message:", aiError?.message);
      console.error("Error code:", aiError?.code);
      console.error("Error name:", aiError?.name);
      console.error("HTTP status:", aiError?.response?.status);
      console.error("Response data:", aiError?.response?.data);
      console.error("Request URL:", aiError?.config?.url);
      console.error("Request method:", aiError?.config?.method);
      console.error("================================");

      // If AI server fails, continue saving empty detections
    }

    const annotatedImage = aiResponse?.data?.annotatedImage || aiResponse?.data?.annotated_image || "";

    const createdResult = await Result.create({
      user: req.user.id,
      image: normalizedImagePath,
      annotatedImage,
      detections: mappedDetections,
      totalDetections: aiResponse?.data?.totalDetections ?? mappedDetections.length,
    });

    console.log("MongoDB save success. Result ID:", createdResult._id);

    // Log Activity
    await Activity.create({
      user: req.user.id,
      type: "upload",
      text: `Analyzed ${mappedDetections[0]?.type || "waste"} scan`
    });

    return res.status(201).json({
      message: "Image uploaded successfully",
      resultId: createdResult._id,
      detections: createdResult.detections,
      annotatedImage: createdResult.annotatedImage,
      annotated_image: createdResult.annotatedImage,
      totalDetections: createdResult.totalDetections,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: "Failed to upload result" });
  }
};

const getResultById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid result ID" });
    }

    const result = await Result.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const resultObject = result.toObject();

    return res.json({
      ...resultObject,
      annotatedImage: resultObject.annotatedImage || resultObject.annotated_image || "",
      annotated_image: resultObject.annotatedImage || resultObject.annotated_image || "",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch result" });
  }
};

const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json(results.map((result) => {
      const resultObject = result.toObject();
      return {
        ...resultObject,
        annotatedImage: resultObject.annotatedImage || resultObject.annotated_image || "",
        annotated_image: resultObject.annotatedImage || resultObject.annotated_image || "",
      };
    }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch results" });
  }
};

const generateReport = async (req, res) => {
  try {
    console.log("=== REPORT ROUTE HIT ===");
    console.log("Result ID:", req.params.id);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[PDF Report] Invalid ID: ${id}`);
      return res.status(400).json({ message: "Invalid result ID" });
    }

    const result = await Result.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!result) {
      console.log(`[PDF Report] Result not found for ID: ${id}`);
      return res.status(404).json({ message: "Result not found" });
    }

    const user = await User.findById(req.user.id);

    // Set headers for PDF download
    const dateStr = new Date(result.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = String(result._id).slice(-4).toUpperCase();
    const scanId = `EC-${dateStr}-${suffix}`;
    const filename = `EcoScan_Report_${scanId}.pdf`;

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    console.log(`[PDF Report] Starting PDF generation for ${filename}`);
    await generatePDF(result, user, res);
    console.log(`[PDF Report] Successfully generated PDF for result ID: ${id}`);

  } catch (error) {
    console.error("[PDF Report] Error generating report:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: error.message
      });
    } else {
      console.error("[PDF Report] Headers already sent, cannot send 500 JSON");
      // The stream might be corrupted if headers are sent and it fails mid-way,
      // ending the response is the best we can do.
      res.end();
    }
  }
};

module.exports = {
  uploadResult,
  getResultById,
  getMyResults,
  generateReport,
};
