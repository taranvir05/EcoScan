import os
import sys
import base64
import logging

import cv2
import numpy as np
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─── Model configuration ─────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
CONFIDENCE_THRESHOLD = 0.25

UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def load_model():
    """Load the local YOLO weights from best.pt in the backend directory."""
    if not os.path.isfile(MODEL_PATH) or os.path.getsize(MODEL_PATH) < 1024:
        raise FileNotFoundError(
            f"Model weights not found at '{MODEL_PATH}'. Place your trained best.pt file next to ai_server.py."
        )

    logger.info(f"Loading YOLO model from: {MODEL_PATH}")
    try:
        model = YOLO(MODEL_PATH)
        logger.info("YOLO model loaded successfully.")
        logger.info(f"  Classes: {list(model.names.values())}")
        return model
    except Exception as exc:
        logger.critical(f"FATAL: Failed to load YOLO model from '{MODEL_PATH}': {exc}")
        raise


try:
    model = load_model()
    print(f"ACTIVE MODEL CLASSES: {model.names}")
    sys.stdout.flush()
except Exception:
    logger.critical("FATAL: Could not initialize the YOLO model.", exc_info=True)
    sys.exit(1)


def _encode_image_base64(image_bgr):
    success, buffer = cv2.imencode(".jpg", image_bgr)
    if not success:
        raise ValueError("Failed to encode annotated image.")
    return base64.b64encode(buffer).decode("utf-8")


def _run_inference(image_path):
    results = model.predict(
        source=image_path,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False,
    )
    return results[0]


@app.route("/health", methods=["GET"])
def health():
    """Health-check endpoint — confirms the model is loaded and ready."""
    return jsonify(
        {
            "status": "ok",
            "model": "yolov11",
            "model_path": MODEL_PATH,
            "project": None,
            "version": None,
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "classes": list(model.names.values()),
        }
    )


@app.route("/detect", methods=["POST"])
def detect():
    """
    Accepts a multipart/form-data POST with an 'image' field.
    Returns detection JSON compatible with the Express backend.
    """
    if "image" not in request.files:
        return jsonify(
            {"error": 'No image field in request. Use multipart/form-data with key "image".'}
        ), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Image field is empty. Please attach an image file."}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    try:
        file.save(filepath)
        logger.info(f"Image received: {filename}")

        result = _run_inference(filepath)

        detections = []
        top_label = None
        top_confidence = 0.0

        if result.boxes is not None and len(result.boxes) > 0:
            for box in result.boxes:
                class_idx = int(box.cls[0])
                confidence_ratio = float(box.conf[0])
                confidence_pct = round(confidence_ratio * 100, 2)
                label = result.names[class_idx]
                x1, y1, x2, y2 = [round(float(v), 2) for v in box.xyxy[0].tolist()]

                detections.append(
                    {
                        "label": label,
                        "confidence": confidence_pct,
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                        },
                    }
                )

                if confidence_pct > top_confidence:
                    top_confidence = confidence_pct
                    top_label = label

        annotated_image = _encode_image_base64(result.plot())

        response = {
            "type": top_label or "unknown",
            "label": top_label or "unknown",
            "confidence": top_confidence,
            "detections": detections,
            "totalDetections": len(detections),
            "annotated_image": annotated_image,
        }

        logger.info(
            f"Result -> type={response['type']}, confidence={response['confidence']}%, "
            f"totalDetections={response['totalDetections']}"
        )
        return jsonify(response)

    except Exception as exc:
        logger.error(f"Prediction error: {exc}", exc_info=True)
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == "__main__":
    logger.info("Starting Flask AI server on port 8000...")
    app.run(host="127.0.0.1", port=8000, debug=False)
