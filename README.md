# EcoScan — AI-Powered Waste Detection

EcoScan is a computer vision application for **multi-object waste material detection** using a custom-trained **YOLO11 object detection model**.

The system analyzes an uploaded image and detects multiple waste objects simultaneously, assigns each detection to a material category, and displays the corresponding bounding box and confidence score.

The project focuses on the complete computer vision workflow — from dataset preparation and model training to inference, evaluation, and web-based visualization.

---

## Overview

Traditional image classification answers:

> "What is in this image?"

EcoScan approaches the problem as **object detection**:

> "What waste materials are present, where are they located, and how confident is the model about each detection?"

A single image can therefore contain multiple objects belonging to the same or different material classes.

### Example

An image containing several waste items may produce detections such as:

```text
Plastic     94.2%
Metal       91.7%
Plastic     88.5%
Cardboard   86.3%
```

Each detection is represented by:

* Material class
* Bounding box coordinates
* Confidence score

---

# Key Features

### 🔍 Multi-Object Detection

Detects multiple waste objects within a single image rather than assigning one label to the entire image.

### 📦 Five Material Classes

The current model detects:

* Cardboard
* Glass
* Metal
* Paper
* Plastic

### 🎯 Bounding Box Localization

For every detected object, the model provides its spatial location using a bounding box.

### 📊 Confidence Analysis

Each detection includes a confidence score indicating how strongly the model supports the predicted material class.

### 🖼️ Visual Detection Results

The application displays the original image alongside the annotated detection output.

### 📈 Detection Summary

The results interface summarizes:

* Total detected objects
* Number of unique material classes
* Per-material object counts
* Detection confidence
* Individual detection details

### 📄 Technical PDF Reports

EcoScan can generate a technical detection report containing the scan information, annotated image, detection statistics, and individual bounding-box data.

---

# System Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │   Upload / Results  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node.js / Express │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Python AI Service │
                    │   Flask + YOLO11    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Custom YOLO11 Model │
                    │ Multi-object        │
                    │ Detection           │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │ Detection Results               │
              │                                │
              │ Class + Confidence + Bounding  │
              │ Box Coordinates                 │
              └────────────────┬───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ MongoDB              │
                    │ Scan / History Data  │
                    └─────────────────────┘
```

---

# Computer Vision Pipeline

The core detection workflow is:

```text
Input Image
     ↓
Image Preprocessing
     ↓
YOLO11 Inference
     ↓
Candidate Object Predictions
     ↓
Confidence Filtering
     ↓
Non-Maximum Suppression
     ↓
Final Bounding Boxes
     ↓
Material Classification
     ↓
Visualization & Storage
```

The important distinction is that EcoScan performs **detection rather than simple image classification**.

The model can identify multiple instances and localize each one independently.

---

# Model

EcoScan uses the **YOLO11 object detection architecture** through the Ultralytics framework.

The model was trained for the project's five waste-material classes.

### Current Classes

| Class     | Description           |
| --------- | --------------------- |
| Cardboard | Cardboard-based waste |
| Glass     | Glass waste           |
| Metal     | Metal waste           |
| Paper     | Paper-based waste     |
| Plastic   | Plastic waste         |

The model output for each detection contains:

```text
Class
Confidence
Bounding Box
```

---

# Dataset

A custom waste detection dataset was prepared for the project.

The dataset workflow involved:

1. Collecting waste images
2. Organizing images by material categories
3. Creating object-level annotations
4. Representing objects using bounding boxes
5. Dividing the dataset into training, validation, and testing sets
6. Auditing class distribution and object distribution
7. Training the YOLO11 model
8. Evaluating detection performance

The dataset is structured using the YOLO annotation format.

Each annotation represents an object using:

```text
class_id
x_center
y_center
width
height
```

with coordinates normalized relative to the image dimensions.

---

# Model Training

The model was trained using the Ultralytics YOLO framework.

The training process involved:

* Custom dataset configuration
* Training/validation/test splits
* Image resizing
* Data augmentation
* Multiple training epochs
* Validation during training
* Best-weight selection
* Post-training evaluation

Training experiments and final model evaluation are maintained separately from the deployed application.

---

# Model Evaluation

Detection performance is evaluated using standard object-detection metrics including:

* Precision
* Recall
* F1-score
* IoU
* mAP@50
* mAP@50:95
* Per-class performance
* Confusion matrix

These metrics are used to understand both overall model performance and class-specific weaknesses.

> Evaluation values reported in project documentation are taken from actual model experiments and are not hardcoded into the application.

---

# Why Object Detection?

A classification model generally predicts a label for the entire image.

That approach becomes problematic when an image contains several waste objects.

For example:

```text
          Image
┌─────────────────────────────┐
│   Plastic      Metal        │
│   ┌──────┐     ┌─────┐     │
│   │      │     │     │     │
│   └──────┘     └─────┘     │
│                             │
│       Cardboard             │
│       ┌──────────┐          │
│       │          │          │
│       └──────────┘          │
└─────────────────────────────┘
```

An object detector can identify:

```text
Plastic     → bounding box
Metal       → bounding box
Cardboard   → bounding box
```

This makes the system suitable for images containing multiple waste objects.

---

# Web Application

EcoScan uses a full-stack architecture to connect the computer vision model with a usable application.

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

Responsible for:

* Image upload
* Detection visualization
* Results presentation
* Detection summaries
* Scan history
* PDF export

### Backend

* Node.js
* Express.js
* MongoDB

Responsible for:

* API handling
* Image upload
* Authentication
* Scan storage
* Communication with the AI service
* Result retrieval

### AI Service

* Python
* Flask
* Ultralytics
* YOLO11

Responsible for:

* Loading the trained model
* Running inference
* Processing predictions
* Returning detection results

---

# Project Structure

```text
EcoScan3/
│
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

# Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/taranvir05/EcoScan.git
cd EcoScan
```

## 2. Frontend

```bash
cd waste-ai-frontend
npm install
npm run dev
```

## 3. Backend

```bash
cd waste-ai-backend
npm install
npm run dev
```

## 4. AI Service

Create and activate the Python virtual environment and install the required dependencies according to the AI service configuration.

Then start the Flask service.

> Environment variables such as database credentials and API secrets should be configured locally and must never be committed to GitHub.

---

# Engineering Focus

The primary technical focus of EcoScan is **computer vision and multi-object detection**.

The project explores:

* Object detection
* Bounding-box localization
* Confidence estimation
* Dataset preparation
* Object-level annotation
* Data augmentation
* Model training
* Validation
* Detection metrics
* Error analysis
* Multi-object inference
* Model-to-application integration

The web application provides the interface through which the computer vision system can be tested and demonstrated.

---

# Limitations

The current model predicts **material categories**, not exact object identities.

For example, the model can determine that an object belongs to the `Plastic` class, but it is not specifically trained to distinguish between:

```text
plastic bottle
plastic container
plastic wrapper
plastic cup
```

unless those object types are represented as separate classes in the training dataset.

This is an intentional limitation of the current five-class material-detection formulation.

Future work can investigate finer-grained object categories, larger and more diverse datasets, improved annotation quality, and additional model experiments.

---

# Future Work

Planned improvements include:

* Dataset expansion
* Improved class balance
* More diverse real-world images
* Additional augmentation experiments
* YOLO model-size comparison
* Hyperparameter experiments
* Detailed error analysis
* Small-object detection improvements
* Per-class performance analysis
* Real-time camera inference
* Model optimization for faster inference

---

# Project Status

**Current Stage:** Working multi-object waste detection application

**Core Model:** Custom-trained YOLO11

**Detection Classes:** 5

**Application:** Full-stack web interface with integrated AI inference

The current version represents the working application and serves as the foundation for further model and dataset experimentation.
