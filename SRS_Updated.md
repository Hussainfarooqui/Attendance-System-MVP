# Software Requirements Specification (SRS) - Updated
**Project**: Attendance MVP - AI-Driven Automated Attendance System  
**Target Institution**: IQRA University (IU)  
**Version**: 1.1 (Updated MVP)  
**Status**: Production-Ready / Finalized Prototype

---

## 1. System Overview
The Attendance MVP is a high-fidelity automation tool designed for IQRA University to streamline student attendance tracking. It replaces traditional manual roll calls with a "Scheduled Hit" Computer Vision (CV) system. The system captures student faces at predefined intervals during a session, matches them against a biometric database, and records attendance with high integrity.

---

## 2. Main Changes & Progress Since Initial SRS
Since the initial specification, the following significant architectural and functional changes have been implemented:

| Feature | Initial Specification | Current Implementation (Updated) |
| :--- | :--- | :--- |
| **Database** | Microsoft SQL Server (SSMS) | **Microsoft SQL Server (SSMS)** with Windows Authentication. |
| **Frontend** | Streamlit or React | **React (Vite-based SPA)** with refined UI aesthetics. |
| **Academic Setup** | Manual entry | **Automated Structural Setup**: Signal-based generation of 16 lectures and 32 sessions per course. |
| **Management** | Create/Update | **Full CRUD**: Added administrative Delete functionality for Users and Students. |
| **Audit Trail** | Basic records | **Real-time Audit Logging** for manual attendance overrides. |
| **Biometrics** | Basic embeddings | **512-d Face Embeddings** using ArcFace/FaceNet for high-fidelity recognition. |

---

## 3. User Roles & RBAC
The system strictly enforces Role-Based Access Control via a centralized authentication gateway.

### 3.1 Admin Role
*   **User Management**: Full CRUD (Create, Read, Update, Delete) for Faculty and Students.
*   **Academic Management**: Grouping courses into Clusters (AI, DSA, etc.) and assigning Faculty.
*   **Biometric Enrollment**:
    *   "Take Picture" feature to capture real-time face data.
    *   Automatic generation of 512-d biometric embeddings.
    *   Storage of reference images and embeddings in SQL Server.
*   **System Policy**: Configuration of the 75% attendance threshold for automatic flagging.

### 3.2 Faculty Role
*   **Assigned Course View**: Secure dashboard showing only assigned sections.
*   **Session Monitoring**: Real-time control to start "AI Attendance" sessions.
*   **Manual Verification**: Ability to override AI results with mandatory audit reasons.
*   **Reporting**: Generation of Cumulative, Classroom-wise, and Individual student reports.

---

## 4. Functional Requirements

### 4.1 "Hit-Based" Attendance Engine (CV-A01)
*   **Logic**: 2 Hits per session to ensure presence throughout the lecture duration.
*   **Hit 1 (T+20)**: Automatic activation at the 20-minute mark to capture initial presence.
*   **Hit 2 (T+N)**: Second verification at a later threshold.
*   **Processing**: Camera feed is processed in <10 seconds per hit.

### 4.2 Automated Academic Structure (AC-A01)
*   The system automatically initializes every course with a standard 14-16 week plan.
*   Each course generates 32 distinct attendance-trackable sessions.

### 4.3 Biometric Recognition (BI-A01)
*   **Engine**: OpenCV integration with deep learning models (ArcFace/FaceNet).
*   **Accuracy**: Maintains 100% identity fidelity; detected faces are matched against stored vectors using cosine similarity.

---

## 5. Technical Architecture

### 5.1 Technology Stack
*   **Frontend**: React.js (Vite) - Single Page Application.
*   **Backend**: FastAPI (Python) - High-performance asynchronous API.
*   **Database**: MS SQL Server (SSMS) - Enterprise-grade relational storage.
*   **CV Engine**: InsightFace/OpenCV - Biometric extraction and matching.
*   **Deployment**: Local server with Windows Authentication.

### 5.2 Data Model Highlights
*   **Students**: Stores name, university ID, reference image path, and a `VARBINARY` blob for the 512-d embedding.
*   **Attendance**: Tracks `hit_1_present`, `hit_2_present`, `final_status`, and `is_manual_override`.

---

## 6. Non-Functional Requirements
*   **Latency**: Biometric recognition must complete within 10 seconds of camera activation.
*   **Integrity**: Manual changes must be logged with an override reason to prevent fraud.
*   **Scalability**: The SQL Server backend is configured to handle multiple concurrent session hits across a campus network.

---
**End of Updated SRS**
