import os
import base64
import logging
import time

import cv2
import numpy as np
import onnxruntime as ort

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ONNX model exported from the trained YOLO11 model
MODEL_PATH = os.path.join(BASE_DIR, "best.onnx")

CONFIDENCE_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45

# The ONNX model was exported with 640x640 input
IMAGE_SIZE = 640

# IMPORTANT:
# This order must match the class order used when the YOLO model
# was trained.
CLASS_NAMES = [
    "Cardboard",
    "Glass",
    "Metal",
    "Paper",
    "Plastic"
]


# ============================================================
# TEMPORARY UPLOAD CONFIGURATION
# ============================================================

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "temp_uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ============================================================
# SERVER CONFIGURATION
# ============================================================

# Render requires the application to listen on 0.0.0.0
FLASK_HOST = os.environ.get(
    "FLASK_HOST",
    "0.0.0.0"
)

# Render provides PORT.
# Locally this falls back to 8000.
FLASK_PORT = int(
    os.environ.get(
        "PORT",
        os.environ.get(
            "FLASK_PORT",
            "8000"
        )
    )
)


# ============================================================
# LOAD ONNX MODEL
# ============================================================

def load_model():

    if not os.path.isfile(MODEL_PATH):

        raise FileNotFoundError(
            f"ONNX model not found at '{MODEL_PATH}'. "
            "Place best.onnx next to ai_server.py."
        )

    if os.path.getsize(MODEL_PATH) < 1024:

        raise FileNotFoundError(
            f"ONNX model at '{MODEL_PATH}' appears to be invalid."
        )

    logger.info(
        f"Loading ONNX model from: {MODEL_PATH}"
    )

    try:

        session = ort.InferenceSession(
            MODEL_PATH,
            providers=[
                "CPUExecutionProvider"
            ]
        )

        logger.info(
            "ONNX model loaded successfully."
        )

        logger.info(
            f"Available providers: "
            f"{session.get_providers()}"
        )

        logger.info(
            f"Input name: "
            f"{session.get_inputs()[0].name}"
        )

        logger.info(
            f"Input shape: "
            f"{session.get_inputs()[0].shape}"
        )

        logger.info(
            f"Output name: "
            f"{session.get_outputs()[0].name}"
        )

        logger.info(
            f"Output shape: "
            f"{session.get_outputs()[0].shape}"
        )

        logger.info(
            f"Classes: {CLASS_NAMES}"
        )

        return session

    except Exception as exc:

        logger.critical(
            f"FATAL: Failed to load ONNX model "
            f"from '{MODEL_PATH}': {exc}"
        )

        raise


try:

    session = load_model()

except Exception:

    logger.critical(
        "FATAL: Could not initialize the ONNX model.",
        exc_info=True
    )

    raise


# ============================================================
# MODEL INPUT / OUTPUT NAMES
# ============================================================

INPUT_NAME = session.get_inputs()[0].name

OUTPUT_NAME = session.get_outputs()[0].name


# ============================================================
# IMAGE BASE64 ENCODING
# ============================================================

def _encode_image_base64(image_bgr):

    success, buffer = cv2.imencode(
        ".jpg",
        image_bgr
    )

    if not success:

        raise ValueError(
            "Failed to encode annotated image."
        )

    return base64.b64encode(
        buffer
    ).decode("utf-8")


# ============================================================
# LETTERBOX PREPROCESSING
# ============================================================

def _letterbox(
    image,
    new_shape=(IMAGE_SIZE, IMAGE_SIZE)
):
    """
    Resize image while preserving aspect ratio.

    This is the same general letterbox approach used by YOLO:
    the image is resized and padded to the model's required
    input dimensions.
    """

    original_height, original_width = image.shape[:2]

    new_height, new_width = new_shape

    scale = min(
        new_width / original_width,
        new_height / original_height
    )

    resized_width = int(
        round(original_width * scale)
    )

    resized_height = int(
        round(original_height * scale)
    )

    resized = cv2.resize(
        image,
        (
            resized_width,
            resized_height
        ),
        interpolation=cv2.INTER_LINEAR
    )

    pad_width = (
        new_width -
        resized_width
    )

    pad_height = (
        new_height -
        resized_height
    )

    left = pad_width // 2
    right = pad_width - left

    top = pad_height // 2
    bottom = pad_height - top

    padded = cv2.copyMakeBorder(
        resized,
        top,
        bottom,
        left,
        right,
        cv2.BORDER_CONSTANT,
        value=(114, 114, 114)
    )

    return (
        padded,
        scale,
        left,
        top
    )


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def _preprocess_image(image):

    processed, scale, pad_x, pad_y = _letterbox(
        image
    )

    # BGR -> RGB
    processed = cv2.cvtColor(
        processed,
        cv2.COLOR_BGR2RGB
    )

    # uint8 -> float32
    # Normalize from [0,255] to [0,1]
    processed = processed.astype(
        np.float32
    ) / 255.0

    # HWC -> CHW
    processed = np.transpose(
        processed,
        (2, 0, 1)
    )

    # CHW -> BCHW
    processed = np.expand_dims(
        processed,
        axis=0
    )

    return (
        processed,
        scale,
        pad_x,
        pad_y
    )


# ============================================================
# YOLO ONNX INFERENCE
# ============================================================

def _run_inference(image):

    inference_start = time.time()

    logger.info(
        "Starting ONNX Runtime inference..."
    )

    original_height, original_width = (
        image.shape[:2]
    )

    # --------------------------------------------------------
    # PREPROCESS
    # --------------------------------------------------------

    input_tensor, scale, pad_x, pad_y = (
        _preprocess_image(image)
    )

    # --------------------------------------------------------
    # ONNX INFERENCE
    # --------------------------------------------------------

    outputs = session.run(
        [OUTPUT_NAME],
        {
            INPUT_NAME: input_tensor
        }
    )

    predictions = outputs[0]

    logger.info(
        f"Raw ONNX output shape: "
        f"{predictions.shape}"
    )

    # Model output:
    #
    # (1, 9, 8400)
    #
    # Convert to:
    #
    # (8400, 9)

    predictions = predictions[0].transpose(
        1,
        0
    )

    boxes = []
    scores = []
    class_ids = []

    # --------------------------------------------------------
    # DECODE PREDICTIONS
    # --------------------------------------------------------

    for prediction in predictions:

        x_center = float(
            prediction[0]
        )

        y_center = float(
            prediction[1]
        )

        width = float(
            prediction[2]
        )

        height = float(
            prediction[3]
        )

        class_scores = prediction[4:]

        class_id = int(
            np.argmax(
                class_scores
            )
        )

        confidence = float(
            class_scores[class_id]
        )

        if confidence < CONFIDENCE_THRESHOLD:

            continue

        # ----------------------------------------------------
        # XYWH -> XYXY
        # ----------------------------------------------------

        x1 = (
            x_center -
            width / 2
        )

        y1 = (
            y_center -
            height / 2
        )

        x2 = (
            x_center +
            width / 2
        )

        y2 = (
            y_center +
            height / 2
        )

        # ----------------------------------------------------
        # REMOVE LETTERBOX PADDING
        # ----------------------------------------------------

        x1 = (
            x1 -
            pad_x
        ) / scale

        y1 = (
            y1 -
            pad_y
        ) / scale

        x2 = (
            x2 -
            pad_x
        ) / scale

        y2 = (
            y2 -
            pad_y
        ) / scale

        # ----------------------------------------------------
        # CLAMP TO ORIGINAL IMAGE
        # ----------------------------------------------------

        x1 = max(
            0,
            min(
                x1,
                original_width
            )
        )

        y1 = max(
            0,
            min(
                y1,
                original_height
            )
        )

        x2 = max(
            0,
            min(
                x2,
                original_width
            )
        )

        y2 = max(
            0,
            min(
                y2,
                original_height
            )
        )

        # ----------------------------------------------------
        # STORE BOX
        # ----------------------------------------------------

        boxes.append([
            float(x1),
            float(y1),
            float(x2 - x1),
            float(y2 - y1)
        ])

        scores.append(
            confidence
        )

        class_ids.append(
            class_id
        )

    # --------------------------------------------------------
    # NO DETECTIONS
    # --------------------------------------------------------

    if not boxes:

        logger.info(
            "No detections above confidence threshold."
        )

        logger.info(
            f"ONNX inference completed in "
            f"{time.time() - inference_start:.2f} seconds."
        )

        return [], image.copy()

    # ========================================================
    # NON-MAXIMUM SUPPRESSION
    # ========================================================

    indices = cv2.dnn.NMSBoxes(
        boxes,
        scores,
        CONFIDENCE_THRESHOLD,
        IOU_THRESHOLD
    )

    detections = []

    annotated_image = image.copy()

    if len(indices) > 0:

        indices = np.array(
            indices
        ).flatten()

        for index in indices:

            x, y, w, h = (
                boxes[index]
            )

            x1 = int(
                round(x)
            )

            y1 = int(
                round(y)
            )

            x2 = int(
                round(x + w)
            )

            y2 = int(
                round(y + h)
            )

            class_id = class_ids[index]

            confidence = scores[index]

            # Safety check
            if class_id < 0 or class_id >= len(
                CLASS_NAMES
            ):
                continue

            label = CLASS_NAMES[
                class_id
            ]

            confidence_pct = round(
                confidence * 100,
                2
            )

            # ------------------------------------------------
            # DETECTION OBJECT
            # ------------------------------------------------

            detections.append(
                {
                    "label": label,

                    "confidence": confidence_pct,

                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2
                    }
                }
            )

            # ------------------------------------------------
            # DRAW BOUNDING BOX
            # ------------------------------------------------

            cv2.rectangle(
                annotated_image,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            # ------------------------------------------------
            # DRAW LABEL
            # ------------------------------------------------

            text = (
                f"{label} "
                f"{confidence_pct:.1f}%"
            )

            text_y = max(
                y1 - 10,
                20
            )

            cv2.putText(
                annotated_image,
                text,
                (x1, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
                cv2.LINE_AA
            )

    logger.info(
        f"ONNX inference completed in "
        f"{time.time() - inference_start:.2f} seconds."
    )

    return (
        detections,
        annotated_image
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify(
        {
            "status": "ok",

            "model": "yolov11",

            "runtime": "onnxruntime",

            "provider": "CPUExecutionProvider",

            "model_path": MODEL_PATH,

            "confidence_threshold":
                CONFIDENCE_THRESHOLD,

            "classes": CLASS_NAMES
        }
    )


# ============================================================
# DETECTION ENDPOINT
# ============================================================

@app.route(
    "/detect",
    methods=["POST"]
)
def detect():

    logger.info(
        "=== DETECTION REQUEST RECEIVED ==="
    )

    # --------------------------------------------------------
    # CHECK IMAGE FIELD
    # --------------------------------------------------------

    if "image" not in request.files:

        return jsonify(
            {
                "error":
                    'No image field in request. '
                    'Use multipart/form-data with key "image".'
            }
        ), 400

    file = request.files["image"]

    # --------------------------------------------------------
    # CHECK FILENAME
    # --------------------------------------------------------

    if file.filename == "":

        return jsonify(
            {
                "error":
                    "Image field is empty. "
                    "Please attach an image file."
            }
        ), 400

    # --------------------------------------------------------
    # SECURE FILENAME
    # --------------------------------------------------------

    filename = secure_filename(
        file.filename
    )

    filepath = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    try:

        # ----------------------------------------------------
        # SAVE IMAGE
        # ----------------------------------------------------

        file.save(
            filepath
        )

        logger.info(
            f"Image received: {filename}"
        )

        # ----------------------------------------------------
        # READ IMAGE
        # ----------------------------------------------------

        image = cv2.imread(
            filepath
        )

        if image is None:

            return jsonify(
                {
                    "error":
                        "Could not read uploaded image."
                }
            ), 400

        logger.info(
            f"Image dimensions: "
            f"{image.shape[1]}x{image.shape[0]}"
        )

        # ----------------------------------------------------
        # RUN ONNX INFERENCE
        # ----------------------------------------------------

        detections, annotated = (
            _run_inference(image)
        )

        # ----------------------------------------------------
        # FIND TOP DETECTION
        # ----------------------------------------------------

        top_label = None

        top_confidence = 0.0

        if detections:

            top_detection = max(
                detections,
                key=lambda item:
                    item["confidence"]
            )

            top_label = (
                top_detection["label"]
            )

            top_confidence = (
                top_detection["confidence"]
            )

        # ----------------------------------------------------
        # ANNOTATED IMAGE
        # ----------------------------------------------------

        annotation_start = time.time()

        annotated_image = (
            _encode_image_base64(
                annotated
            )
        )

        logger.info(
            f"Annotated image generated in "
            f"{time.time() - annotation_start:.2f} seconds."
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        response = {

            "type":
                top_label or "unknown",

            "label":
                top_label or "unknown",

            "confidence":
                top_confidence,

            "detections":
                detections,

            "totalDetections":
                len(detections),

            "annotated_image":
                annotated_image
        }

        logger.info(
            f"Result -> "
            f"type={response['type']}, "
            f"confidence={response['confidence']}%, "
            f"totalDetections={response['totalDetections']}"
        )

        return jsonify(
            response
        )

    except Exception as exc:

        logger.error(
            f"Prediction error: {exc}",
            exc_info=True
        )

        return jsonify(
            {
                "error":
                    f"Prediction failed: {str(exc)}"
            }
        ), 500

    finally:

        # ----------------------------------------------------
        # ALWAYS DELETE TEMPORARY IMAGE
        # ----------------------------------------------------

        if os.path.exists(
            filepath
        ):

            os.remove(
                filepath
            )


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    logger.info(
        f"Starting ONNX AI server "
        f"on {FLASK_HOST}:{FLASK_PORT}..."
    )

    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=False
    )