# Janmasethu Domain - In-Depth Feature Specification

This document provides a detailed breakdown of every module implemented in the **Janmasethu** medical orchestration system. Each feature is defined by its **Definition**, **Purpose**, **Rationale (Why it was implemented)**, and the **Technical Endpoint** used to interact with it.

---

## 🏗️ PART 1: BACKEND CORE FEATURES (Control Tower Core)

### 1. Advanced RBAC (Role-Based Access Control)
- **Definition**: A security and visibility layer that restricts data access based on the clinician's role (CRO, Doctor, Nurse).
- **Purpose**: To ensure that only medical staff with the appropriate specialization can view or interact with specific patient categories.
- **Why Implemented**: To prevent "information overload" and clinical noise. Doctors should only see critical `RED` emergencies, while Nurses handle `YELLOW` urgent cases. It also prevents the AI from interfering once a human has established authority.
- **Endpoint**: `GET /janmasethu/threads` (Uses `x-user-role` header for filtering).

### 2. Clinical Context Review (Historical Context)
- **Definition**: A service that reconstructs the full chronological history of messages between a patient and the system.
- **Purpose**: To provide a clinician with the "backstory" of a patient's distress before they send a manual clinical response.
- **Why Implemented**: Medical safety requirement. A clinician cannot safely treat a patient without knowing what has already been discussed or recommended by the AI.
- **Endpoint**: `GET /janmasethu/context/:id` (Returns chronological USER/AI/HUMAN message types).

### 3. Medical SLA (Service Level Agreement) Worker
- **Definition**: A background process managed by `BullMQ` that monitors the time elapsed since a high-priority thread was assigned to a clinician.
- **Purpose**: To track a 5-minute response window for `RED` (Emergency) threads.
- **Why Implemented**: To guarantee that no emergency goes unhandled. If a doctor is busy or misses a notification, the system automatically detects the "breach" and reverts the thread back to the global queue for the CRO to reassign.
- **Endpoint**: Triggered internally via `POST /janmasethu/assign/:id` and monitored via audit logs.

### 4. Hybrid Risk Scoring Engine
- **Definition**: A weighted calculation engine that combines signals from Keywords, BERT Transformers, Sentiment Analysis, and History.
- **Purpose**: To assign a numerical "Risk Score" (0-100) to every incoming message to determine its clinical severity.
- **Why Implemented**: Single-signal detection (like just keywords) is prone to false positives/negatives. Aggregating multiple AI and heuristic signals provides a robust "Safety First" classification.
- **Endpoint**: `POST /janmasethu/channel/webhook` (Internal processing is triggered on message arrival).

### 5. BERT Model Semantic Integration
- **Definition**: Integration with a Deep Learning (BERT) transformer model specialized in clinical intent classification.
- **Purpose**: To understand the *meaning* and *risk level* of an incoming message beyond simple text matching.
- **Why Implemented**: Patients often use varying language to describe symptoms. The BERT model can identify that "I feel a heavy pressure in my chest" is high-risk even if the word "pain" isn't explicitly used.
- **Endpoint**: External `GET /predict` (called asynchronously by `BertRiskAnalyzer`).

### 6. High-Arousal Sentiment Detection
- **Definition**: A lexicon-based detector that identifies emotional distress and "high-arousal" urgency in patient language.
- **Purpose**: To calculate the "Emotional Distress Factor" of a thread.
- **Why Implemented**: A patient who is "scared" or "worried" requires faster human intervention than one who is simply asking for information, even if their symptoms seem similar.
- **Endpoint**: Integrated into the internal `evaluateThreadSentiment` pipeline.

### 7. Human Takeover & AI Suppression
- **Definition**: A locking mechanism that switches ownership from `AI` to `HUMAN` and disables automated responses.
- **Purpose**: To give clinicians exclusive control over the conversation.
- **Why Implemented**: Clinical liability. Once a doctor intervenes, the AI must be silenced to prevent conflicting or dangerous medical advice from being generated automatically.
- **Endpoint**: `POST /janmasethu/take-control/:id`.

---

## 💻 PART 2: FRONTEND CLINICAL DASHBOARD (Janmasethu Dashboard)

### 8. Real-Time Clinical Queues (Polling Architecture)
- **Definition**: High-priority UI views (Doctor Queue, Nurse Queue) that synchronize with the backend every 5 seconds.
- **Purpose**: To provide clinicians with a "Live View" of their assigned cases.
- **Why Implemented**: Clinicians in a hospital environment need "Zero-Click" updates. They cannot afford to manually refresh the page to see if a new emergency has arrived.
- **Endpoint Connectivity**: `GET /janmasethu/threads` (Refetched automatically via `useQuery`).

### 9. Interactive Thread Modal (Workspace)
- **Definition**: A unified interaction layer that combines the history, clinical context, and response UI.
- **Purpose**: To serve as the clinician's primary tool for patient resolution.
- **Why Implemented**: To provide a seamless workflow where the clinician can "Review Context" → "Take Control" → "Send Reply" within a single screen.
- **Endpoint Connectivity**: `POST /janmasethu/reply` (Dispatches response to WhatsApp/Web).

### 10. CRO Assignment Portal
- **Definition**: An administrative tool for the Chief Resident Officer to manually manage clinician workloads.
- **Purpose**: To manually assign thread ownership to specific doctors or nurses.
- **Why Implemented**: In high-load clinical scenarios, a human (CRO) is needed to balance the queue and ensure the right specialist is assigned to the right patient.
- **Endpoint Connectivity**: `POST /janmasethu/assign/:id`.

### 11. System Health & Audit Logging
- **Definition**: A visibility dashboard for monitoring system uptime and human activity trails.
- **Purpose**: To ensure the "Control Tower" itself is functioning and provided a forensic record of events.
- **Why Implemented**: Medical accountability. If a patient outcome is poor, administrators need to see exactly who took control, when they took it, and if any system (like BERT) failed during the process.
- **Endpoint Connectivity**: `GET /thread/audit/all`.

---

> [!IMPORTANT]
> **Production Integrity**: Every feature listed above is designed with transactional safety (Supabase atomic updates) to ensure that clinical state remains consistent even under high concurrency.
