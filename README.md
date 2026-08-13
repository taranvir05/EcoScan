# EcoScan — AI-Powered Waste Detection

EcoScan is a **computer vision application for multi-object waste material detection** using a custom-trained **YOLO11** model.

The system detects multiple waste objects in a single image, identifies their material category, localizes them using bounding boxes, and provides confidence scores for each detection.

## Classes

* Cardboard
* Glass
* Metal
* Paper
* Plastic

## Computer Vision Pipeline

```text
Input Image
     ↓
YOLO11 Inference
     ↓
Object Detection
     ↓
Confidence Filtering
     ↓
Bounding Boxes + Classes
     ↓
Visualization & Storage
```

## Key Features

* Multi-object waste detection
* Bounding-box localization
* Confidence score analysis
* Custom YOLO11 model training
* Dataset annotation and preparation
* Detection evaluation using Precision, Recall, IoU and mAP
* Visual detection results
* Scan history and technical PDF reports

## Tech Stack

**AI/ML:** Python, YOLO11, Ultralytics, OpenCV
**Backend:** Node.js, Express.js, MongoDB
**Frontend:** React, TypeScript, Vite, Tailwind CSS
**AI Service:** Python + Flask

## Architecture

```text
React Frontend
      ↓
Node.js / Express
      ↓
Python / Flask AI Service
      ↓
Custom YOLO11 Model
      ↓
Detection Results
      ↓
MongoDB + Results UI
```

## Dataset

A custom object-detection dataset was prepared with bounding-box annotations for the five material classes. The workflow included dataset organization, annotation, train/validation/test splitting, augmentation, model training, and evaluation.

## Limitations

The current model detects **material categories rather than exact object identities**. For example, it identifies an object as `Plastic` rather than specifically classifying it as a bottle, container, or cup.

## Future Work

* Dataset expansion and quality improvement
* Model and augmentation experiments
* Detailed error analysis
* YOLO model comparison
* Improved small-object detection
* Real-time camera inference
