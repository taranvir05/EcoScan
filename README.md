# 🚀 EcoScan – AI-Powered Waste Detection

An end-to-end **Computer Vision and Multi-Object Detection** application that detects multiple waste materials in images using a custom-trained **YOLO11** model.

EcoScan identifies waste objects, localizes them with bounding boxes, assigns material categories, and provides confidence scores through an interactive web application.

---

## 📌 Project Overview

Waste images often contain multiple objects appearing at different locations, sizes, and overlaps.

EcoScan approaches this as an **object detection problem** rather than simple image classification.

The system can simultaneously detect multiple instances belonging to different material categories and visualize their locations within the image.

Current detection classes:

* Cardboard
* Glass
* Metal
* Paper
* Plastic

---

## ✨ Key Features

### 🔍 Multi-Object Detection

Detects multiple waste objects within a single image using a custom-trained YOLO11 model.

### 📦 Bounding Box Localization

Each detected object is localized using a bounding box with its predicted material class.

### 🎯 Confidence Analysis

Displays the confidence score associated with every detection.

### 📊 Detection Analytics

Provides:

* Total objects detected
* Material-wise object counts
* Average confidence
* Individual detection details
* Per-object confidence scores

### 🖼️ Visual Detection Results

Displays the original image and YOLO-annotated output, allowing users to visually inspect model predictions.

### 📄 Technical PDF Reports

Generates a structured detection report containing scan information, detection results, annotated imagery, confidence information, and technical model details.

### 🗂️ Scan History

Stores previous detection results so users can review their scans.

---

# 🧠 Computer Vision Pipeline

```text
Input Image
      │
      ▼
Image Preprocessing
      │
      ▼
YOLO11 Object Detection
      │
      ▼
Bounding Box Predictions
      │
      ▼
Confidence Filtering
      │
      ▼
Material Classification
      │
      ▼
Detection Visualization
      │
      ▼
Results & Storage
```

---

# 🏗 Project Architecture

```text
              React Frontend
                    │
                    ▼
             Node.js Backend
                    │
                    ▼
            Python AI Service
                    │
                    ▼
              YOLO11 Model
                    │
                    ▼
        Multi-Object Detections
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Results UI           MongoDB
          │
          ▼
      PDF Report
```

---

# 🤖 Model

**Architecture:** YOLO11
**Framework:** Ultralytics
**Task:** Object Detection
**Classes:** 5

The model predicts:

```text
Material Class
Confidence Score
Bounding Box Coordinates
```

Unlike image classification, the model can produce multiple detections from the same image.

---

# 📊 Model Evaluation

The model is evaluated using standard object-detection metrics:

* Precision
* Recall
* F1 Score
* IoU
* mAP@50
* mAP@50:95
* Confusion Matrix
* Per-class performance
Model evaluation and experimentation are part of the ongoing development of the computer vision pipeline.

---

# 🗃️ Dataset

A custom waste detection dataset was prepared and annotated for the five material classes.

The dataset workflow includes:

* Image collection
* Data organization
* Object-level bounding-box annotation
* Train/validation/test splitting
* Dataset auditing
* Data augmentation
* Model training
* Validation and evaluation

The model uses the YOLO annotation format for object-level detection.

---

# 🛠 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB

### Computer Vision

* Python
* YOLO11
* Ultralytics
* OpenCV
* Flask

### Reporting

* PDF generation

---

# 📂 Project Structure

```text
EcoScan/

├── waste-ai-frontend/
│   ├── src/
│   └── ...
│
├── waste-ai-backend/
│   ├── src/
│   ├── server.js
│   └── ...
│
├── ai-service/
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 🚀 Installation

```bash
git clone https://github.com/taranvir05/EcoScan.git

cd EcoScan
```

### Frontend

```bash
cd waste-ai-frontend
npm install
npm run dev
```

### Backend

```bash
cd waste-ai-backend
npm install
npm run dev
```

### AI Service

Set up the Python environment and install the required dependencies before starting the Flask AI service.

Environment variables such as database credentials should be configured locally and must not be committed to the repository.


---

# 🔮 Future Enhancements

* Dataset expansion and improved annotation quality
* YOLO model comparison
* Hyperparameter experiments
* Detailed error analysis
* Improved small-object detection
* Real-time camera inference
* Model optimization for faster inference
* Additional waste categories

---

# 📌 Project Status

**Status:** Working Computer Vision Application

EcoScan currently provides an end-to-end pipeline from **image upload → YOLO11 inference → multi-object detection → visualization → result storage → technical reporting**.
