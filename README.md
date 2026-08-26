# 📱 Studify Success — Project Documentation & Handover Report

[![React Native](https://img.shields.io/badge/React%20Native-0.75+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=flat)](https://www.android.com/)

Comprehensive project documentation, system architecture, database design, API specification, and developer handover guide for the **Studify Success** mobile application ecosystem.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Tools](#2-tech-stack--tools)
3. [Architecture & Data Flow](#3-architecture--data-flow)
   - [High-Level Architecture](#high-level-system-architecture)
   - [Data Flow Diagram (DFD)](#data-flow-diagram-dfd)
   - [Database Schema & Entity Relationships (ERD)](#database-schema--entity-relationships)
4. [Local Setup & Installation](#4-local-setup--installation)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Environment Configuration Template](#environment-configuration)
5. [API Documentation](#5-api-documentation)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Intern & Team Leader Endpoints](#intern--team-leader-endpoints)
   - [Task Management Endpoints](#task-management-endpoints)
   - [Live Trainings & Meeting Endpoints](#live-trainings--meeting-endpoints)
6. [Known Issues & Limitations](#6-known-issues--limitations)
7. [Future Scope & Upgrades](#7-future-scope--upgrades)

---

## 1. Project Overview

**Studify Success** is an enterprise-grade mobile platform combining a rich **EdTech Learning Hub** with an integrated **Internship & Team Operations Ecosystem**. The platform caters to four distinct user roles, ensuring secure, role-based workflows and end-to-end task tracking:

### 👥 Target User Roles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER ROLE HIERARCHY                           │
├──────────────┬──────────────┬────────────────────────┬──────────────────┤
│   STUDENT    │    INTERN    │      TEAM LEADER       │     FOUNDER      │
├──────────────┼──────────────┼────────────────────────┼──────────────────┤
│ • Courses    │ • Tasks      │ • Team Roster & Depts  │ • Org Overview   │
│ • Lectures   │ • Submissions│ • Task Studio & Review │ • Admin Control  │
│ • Quizzes    │ • Attendance │ • Live Training Meets  │ • TL Management  │
│ • Certs      │ • Leave Req  │ • Feedback & Ratings   │ • Dept Analytics │
│ • AI Tutor   │ • Accolades  │ • Duration Updates     │ • Master Reports │
└──────────────┴──────────────┴────────────────────────┴──────────────────┘
```

### 🌟 Core Features Implemented

- **Strict 3-Way Role Authentication**: Independent login tabs (`Student`, `Intern`, `TL`) with database-level role enforcement, enterprise passcode protection (`TL@STUDIFY2026`), and automatic redirection.
- **Internship Workspace & Task Studio**: Dynamic department task assignment across 22 company departments, multi-status task lifecycles (`Todo`, `In Progress`, `Review`, `Done`), star accolade calculations, and submission reviews.
- **Attendance, Leaves & Duration Management**: Geolocation/timestamp-safe attendance logging, leave request workflows, dynamic joined-date to completion percentage tracker, and TL duration assignment (`1`, `2`, `3`, `6 Months`).
- **Live Mentorship & Trainings**: Real-time training schedules with meeting link integration, timezone-safe date parsing, and automatic expired meeting status handling.
- **Focus Space & Ambient Audio**: Study soundscapes, binaural focus modes, and timer utilities.
- **In-App Messaging & Department Groups**: Department master group chats (`${Department} Team`) automatically provisioned for Team Leaders.

---

## 2. Tech Stack & Tools

### Frontend (Mobile App)
| Layer | Technologies / Packages |
| :--- | :--- |
| **Framework** | React Native (v0.75+), React (v18.3+) |
| **State Management** | Redux, Redux Thunk, React Context |
| **UI Components & Icons** | React Native Paper, React Native Vector Icons, React Native SVG |
| **Navigation** | React Navigation (Stack, Drawer, Bottom Tabs) |
| **Animations** | React Native Reanimated, Gesture Handler |
| **Media & Audio** | React Native Video, HTML-to-PDF, React Native PDF |
| **File & Document Handling** | `@react-native-documents/picker`, `react-native-image-picker` |
| **Payments** | Razorpay React Native SDK |
| **Push Notifications** | `@notifee/react-native`, `@react-native-firebase/messaging` |

### Backend (Server & Database)
| Layer | Technologies / Packages |
| :--- | :--- |
| **Runtime & Engine** | Node.js (v18 LTS / v20 LTS), Express.js |
| **Database** | MySQL 8.0 (Connection Pooling across Core, LMS, WBB databases) |
| **Realtime / Chat** | MQTT Protocol, WebSocket / Socket.io, MongoDB Atlas |
| **Authentication & Security**| JSON Web Tokens (JWT), Bcrypt (Salt rounds: 10) |
| **Mailing / SMTP** | Nodemailer (Custom SMTP for transactional OTPs & notifications) |
| **AI LLM Integration** | Groq AI SDK (Llama 3 inference engine) |

### Development & Build Tools
- **Android SDK**: CompileSdk 35, TargetSdk 35, MinSdk 23
- **Build System**: Gradle 8.7, Android Gradle Plugin (AGP) 8.2.1, JDK 17
- **API Testing**: Postman / cURL

---

## 3. Architecture & Data Flow

### High-Level System Architecture

```mermaid
graph TD
    Client["📱 Studify React Native Mobile App"]
    
    subgraph Backend_Gateway ["🚀 Node.js / Express API Gateway"]
        AuthMiddleware["🛡️ Auth & Role Middleware (JWT + 3-Way Role Guard)"]
        Routes["API Router (/api, /interns, /user, /lms, /auth)"]
    end
    
    subgraph Data_Storage ["💾 Database & Storage Layer"]
        MySQL_Main[("🗄️ MySQL: Users, Tasks, Roles, Profiles")]
        MySQL_LMS[("📚 MySQL: Courses & Quizzes")]
        MongoDB_AI[("🤖 MongoDB: AI Chatbot History")]
        LocalHLS["🎥 Local / CDN HLS Video Storage"]
    end
    
    subgraph External_Services ["🌐 Cloud & External Services"]
        SMTP["✉️ SMTP Mail Server (OTPs)"]
        FCM["🔔 Firebase Cloud Messaging"]
        Groq["🧠 Groq AI LLM Service"]
    end

    Client -->|HTTPS REST Requests| Backend_Gateway
    AuthMiddleware --> Routes
    Routes --> MySQL_Main
    Routes --> MySQL_LMS
    Routes --> MongoDB_AI
    Routes --> LocalHLS
    Routes --> SMTP
    Routes --> FCM
    Routes --> Groq
```

---

### Data Flow Diagram (DFD)

#### Level 0 DFD (Context Diagram)

```mermaid
flowchart LR
    User(["👤 User (Student / Intern / TL / Founder)"])
    App[["📱 Studify System"]]
    DB[("🗄️ Database")]
    External[("🌐 External Services: SMTP / FCM / Razorpay")]

    User -->|Sign In / Sign Up / Submissions| App
    App -->|Profiles, Tasks, Attendance, Courses| User
    App <-->|Read / Write SQL Operations| DB
    App <-->|Trigger Emails, Push Notifications, Payment Verification| External
```

#### Level 1 DFD (Core Role & Task Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Intern
    actor TL as Team Leader
    participant App as Mobile App
    participant API as Backend API
    participant DB as MySQL DB

    User->>App: Sign In (Email, Password, Role Tab)
    App->>API: POST /api/user/signin
    API->>DB: Query users (Verify password, is_intern, is_tl)
    DB-->>API: User Row & Flags
    API-->>App: 200 OK + JWT Token (or 403 Tab Block)
    
    TL->>App: Create Department Task
    App->>API: POST /interns/tasks
    API->>DB: INSERT into tasks (department, title, deadline)
    DB-->>API: Success
    
    User->>App: View Tasks & Submit Assignment
    App->>API: POST /interns/tasks/submit
    API->>DB: INSERT into intern_task_submissions (task_id, repo_link, notes)
    
    TL->>App: Review & Award Stars
    App->>API: POST /interns/tasks/review
    API->>DB: UPDATE status = 'Approved', Award Stars
    DB-->>App: Realtime Dashboard Sync
```

---

### Database Schema & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ INTERN_PROFILES : "has profile"
    USERS ||--o{ TASKS : "created by TL"
    USERS ||--o{ INTERN_TASK_SUBMISSIONS : "submitted by intern"
    USERS ||--o{ INTERN_ATTENDANCE : "logs attendance"
    USERS ||--o{ INTERN_LEAVES : "applies leave"
    USERS ||--o{ INTERN_LIVE_TRAININGS : "hosted by TL"
    USERS ||--o{ CHAT_GROUPS : "owns group"

    USERS {
        int user_id PK
        string fname
        string lname
        string email UK
        string phone
        string password
        int is_intern
        int is_tl
        int verified
        date created_at
    }

    INTERN_PROFILES {
        int id PK
        int user_id FK
        string department
        string status
        date joined_date
        string duration
        string offer_letter_name
    }

    TASKS {
        int id PK
        int created_by FK
        string department
        string title
        string description
        string deadline
        int max_stars
        string status
    }

    INTERN_TASK_SUBMISSIONS {
        int id PK
        int task_id FK
        int intern_id FK
        string submission_url
        string notes
        string status
        int awarded_stars
        datetime submitted_at
    }

    INTERN_LIVE_TRAININGS {
        int id PK
        int tl_id FK
        string department
        string title
        string topic
        string scheduled_time
        string meeting_link
        datetime created_at
    }

    INTERN_ATTENDANCE {
        int id PK
        int intern_id FK
        date date
        string status
        string punch_in_time
        string punch_out_time
    }

    INTERN_LEAVES {
        int id PK
        int intern_id FK
        string reason
        date start_date
        date end_date
        string status
    }
```

---

## 4. Local Setup & Installation

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS ([Download Node](https://nodejs.org/))
- **Java Development Kit (JDK)**: `JDK 17` (Microsoft OpenJDK 17 or Azul Zulu 17)
- **Android Studio**: Android SDK Platforms 34 & 35, Android SDK Build-Tools, Android Virtual Device (AVD)
- **Database**: MySQL Server 8.0+

---

### Backend Setup

1. **Navigate to the Backend Directory**:
   ```bash
   cd SS-backend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database and SMTP credentials:
   ```bash
   cp .env.example .env
   ```

4. **Start the Backend Server**:
   ```bash
   # Development mode
   npm run dev

   # OR Standard mode
   npm start
   ```
   *The server will start listening at `http://localhost:3000`.*

---

### Frontend Setup

1. **Navigate to Project Root**:
   ```bash
   cd ..
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Metro Bundler**:
   ```bash
   npm start
   ```

4. **Run on Connected Android Device or Emulator** (in a new terminal):
   ```bash
   npm run android
   ```

5. **Compile Standalone Release APK**:
   ```bash
   cd android
   ./gradlew clean assembleRelease
   ```
   *Output APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.*

---

### Environment Configuration Template

#### Backend `.env.example`
```env
PORT=3000
SECRET_KEY="your_jwt_secret_key"

EMAIL_USER="your_email@example.com"
EMAIL_PASSWORD="your_smtp_password"
EMAIL_HOST="smtp.example.com"

DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_password"
DB_DATABASE="studifysuccess_main"
DB_C_DATABASE="studifysuccess_course"
DB_C_USER="root"
DB_LMS_USER="root"
DB_LMS_PASSWORD="your_password"
DB_WBB_USER="root"
DB_WBB_PASSWORD="your_password"

VIDEO_STORAGE_PATH="./uploads/videos"
PUBLIC_HLS_URL="http://localhost:3000/videos/hls"

GROQ_API_KEY="your_groq_api_key"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/chatbotDB"
```

---

## 5. API Documentation

### Base URL
- Local: `http://localhost:3000/api`
- Production: `https://studifysuccess.com/api`

---

### Authentication Endpoints

#### 1. Sign In
- **Endpoint**: `POST /api/user/signin`
- **Description**: Authenticates user and enforces strict 3-way role matching based on the active tab.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password@123",
    "role": "tl"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": 200,
    "message": "Success",
    "data": {
      "user": {
        "user_id": 1916,
        "fname": "Shreya",
        "lname": "Agarwal",
        "email": "agarwalshreya361@gmail.com",
        "is_intern": false,
        "is_tl": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Role Mismatch Error (`403 Forbidden`)**:
  ```json
  {
    "status": 403,
    "message": "Access Denied: This account is registered as a Team Leader. Please switch to the TL tab to sign in.",
    "data": null
  }
  ```

---

#### 2. Sign Up (with TL Enterprise Security Code)
- **Endpoint**: `POST /api/user/signup`
- **Description**: Creates a new user account. If `is_tl` is true, requires valid security passcode `TL@STUDIFY2026`.
- **Request Body**:
  ```json
  {
    "fname": "Aditi",
    "lname": "Malviya",
    "email": "aditi@example.com",
    "phone": "9876543210",
    "password": "Password@123",
    "dob": "2000-05-15",
    "gender": "Female",
    "is_tl": 1,
    "department": "Tech",
    "tlAccessCode": "TL@STUDIFY2026"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": 200,
    "message": "Verify your Email address",
    "data": null
  }
  ```

---

### Intern & Team Leader Endpoints

#### 3. Update Intern Duration (TL Only)
- **Endpoint**: `POST /interns/team/update-duration`
- **Request Body**:
  ```json
  {
    "internId": 1599,
    "duration": "3 Months"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": 200,
    "message": "Duration updated successfully",
    "data": null
  }
  ```

---

#### 4. Schedule Live Training / Meeting
- **Endpoint**: `POST /interns/live_trainings`
- **Request Body**:
  ```json
  {
    "department": "Tech",
    "title": "React Native Architecture Sync",
    "topic": "Redux Toolkit & State Flow",
    "scheduled_time": "2026-08-28 at 05:00 PM",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "status": 200,
    "message": "Live session scheduled successfully",
    "data": null
  }
  ```

---

## 6. Known Issues & Limitations

1. **Android Time Formatting Unicode Non-Breaking Spaces**:
   - *Behavior*: Some Android devices generate unicode narrow non-breaking spaces (`\u202f`) when formatting AM/PM time strings.
   - *Resolution*: Implemented regex sanitation (`/[\u202f\u00a0?]/g, ' '`) on both client and server before MySQL insertion.
2. **Android 14 / SDK 35 Background Alarms**:
   - *Behavior*: Strict background process battery optimization on newer Android versions.
   - *Resolution*: Integrated Notifee foreground service handlers for long-running focus timers and chat polling.
3. **Multi-Database Query Isolation**:
   - *Behavior*: LMS, WBB, and Course databases operate under separate connection pools. Cross-database queries must be routed through explicit controller helpers.

---

## 7. Future Scope & Upgrades

1. **In-App Video Conferencing**:
   - Direct WebRTC / Agora integration for 1-on-1 and department video mentorship calls inside the app without external Google Meet links.
2. **Automated Coding Sandbox & Evaluator**:
   - Automated grading and test execution for Tech Department task submissions.
3. **Advanced AI Performance Analytics**:
   - LLM-powered intern productivity summarization and automated weekly progress report generation for Team Leaders and Founders.
4. **Offline-First Architecture**:
   - WatermelonDB / SQLite local caching with bi-directional sync for seamless offline learning and task management.

---

## 👨‍💻 Project Maintainers & Handover Contacts

- **Project**: Studify Success Mobile Ecosystem
- **Handover Date**: August 2026
- **Submission Target**: Team Leaders (Suyash & Shreya)
