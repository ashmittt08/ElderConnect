# 🤝 ElderConnect

**Connecting Generations, Enriching Lives**

ElderConnect is a full-stack mobile application that bridges seniors, volunteers, and NGOs to create a compassionate support network for aging with dignity. Seniors can request help with daily tasks, volunteers can respond to those requests, and NGOs can coordinate resources and events — all in one platform.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [User Roles](#-user-roles)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Role-based Auth** | Separate flows for Elders, Volunteers, NGOs, and Admins via Firebase Authentication |
| 📦 **Delivery Tracking** | Real-time medicine & grocery delivery with live volunteer location via Socket.IO |
| 🤖 **AI Companion** | 24/7 AI chat assistant (powered by Groq / LLaMA 3) for seniors |
| 📋 **Request Management** | Elders create help requests (medicine, food, emergency); volunteers accept & complete them |
| 🏢 **NGO Dashboard** | NGOs manage volunteers, assign tasks, host events, and view statistics |
| 🎉 **Community Events** | NGOs publish events that volunteers and elders can discover |
| 🛡️ **Admin Panel** | User management, NGO approvals, flagged reports, and activity monitoring |
| 🖼️ **Profile & Verification** | Profile photo upload (Cloudinary), ID verification with status tracking |
| 📍 **Nearest NGO Finder** | Address-based matching to surface the most relevant NGOs for an elder |

---

## 🛠 Tech Stack

### Frontend
- **React Native** (Expo ~54)
- **Expo Router** for file-based navigation
- **React Navigation** (bottom tabs + stack)
- **Socket.IO Client** for real-time delivery tracking
- **Firebase SDK** for authentication
- **Axios** for REST API calls
- **React Native Maps** for delivery map view

### Backend
- **Node.js** with **Express 5**
- **MongoDB** + **Mongoose** for data persistence
- **Firebase Admin SDK** for token verification
- **Socket.IO** for real-time bidirectional events
- **Cloudinary** + **Multer** for image/file uploads
- **OpenAI-compatible SDK** pointed at **Groq API** for AI chat
- **Clerk Express** middleware (optional auth layer)

---

## 📁 Project Structure

```
ElderConnect/
├── Elder_backend-main/         # Node.js/Express REST API + Socket.IO server
│   ├── server.js               # Entry point — Express app, Socket.IO, route wiring
│   ├── firebase.js             # Firebase client config
│   └── src/
│       ├── config/             # DB connection, Cloudinary, Firebase Admin
│       ├── middleware/         # verifyUser, requireRole, upload
│       ├── models/             # Mongoose schemas (User, Request, DeliveryOrder, Event, Medicine)
│       └── routes/             # Route handlers per role
│           ├── authRoutes.js
│           ├── elderRoutes.js
│           ├── volunteerRoutes.js
│           ├── ngoRoutes.js
│           ├── adminRoutes.js
│           ├── profileRoutes.js
│           ├── deliveryRoutes.js
│           └── eventRoutes.js
│
└── Elder_frontend-main/        # React Native (Expo) mobile app
    ├── App.jsx                 # Root component
    ├── app.json                # Expo configuration
    └── src/
        ├── api/                # Axios API client modules
        ├── components/         # Shared UI components
        ├── config/             # App-level config (Firebase, etc.)
        ├── context/            # React context providers
        ├── hooks/              # Custom hooks (useResponsive, etc.)
        ├── navigation/         # AppNavigator
        ├── screens/            # Role-specific screens
        └── animations/         # Lottie / Reanimated animations
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MongoDB** instance (local or Atlas)
- **Firebase** project with Authentication enabled
- **Expo CLI**: `npm install -g expo-cli`
- **Cloudinary** account for image uploads
- **Groq** API key for AI companion chat

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd Elder_backend-main

# 2. Install dependencies
npm install

# 3. Create a .env file (see Environment Variables section)
cp .env.example .env   # or create manually

# 4. Start the development server
npm run dev
```

The server will start on `http://localhost:5000` by default.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd Elder_frontend-main

# 2. Install dependencies
npm install

# 3. Update the API base URL in src/api/index.js (or src/config/network.js) to point to your backend

# 4. Start the Expo development server
npm start

# Run on a specific platform
npm run android   # Android emulator / device
npm run ios       # iOS simulator / device
npm run web       # Web browser
```

---

## 🔑 Environment Variables

Create a `.env` file inside `Elder_backend-main/`:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/elderconnect

# Firebase Admin SDK (JSON string or path to service account file)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq (AI Companion)
GROQ_API_KEY=your_groq_api_key

```

---

## 📡 API Overview

All endpoints require a valid Firebase ID token sent as `Authorization: Bearer <token>` unless noted otherwise.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Public | Health check |
| `POST` | `/auth/register` | — | Register / sync user |
| `POST` | `/elder/request` | Elder | Create a help request |
| `GET` | `/elder/requests` | Elder | List own requests |
| `GET` | `/elder/nearest-ngos` | Elder | Get nearest NGOs |
| `POST` | `/elder/chat` | Elder | AI companion chat |
| `GET` | `/volunteer/requests` | Volunteer | Browse pending requests |
| `POST` | `/volunteer/accept/:id` | Volunteer | Accept a request |
| `POST` | `/volunteer/complete/:id` | Volunteer | Mark request complete |
| `GET` | `/ngo/stats` | NGO | Dashboard statistics |
| `GET` | `/ngo/volunteers` | NGO | List volunteers |
| `POST` | `/ngo/assign` | NGO | Assign volunteer to request |
| `GET` | `/delivery/orders` | Elder | List delivery orders |
| `POST` | `/delivery/create` | Elder | Create delivery order |
| `GET` | `/events` | All | List community events |
| `POST` | `/events` | NGO | Create an event |
| `GET` | `/admin/users` | Admin | Manage all users |
| `PATCH` | `/admin/approve/:id` | Admin | Approve / reject NGO |

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Elder** | Create help/delivery requests, chat with AI companion, discover NGOs, track deliveries |
| **Volunteer** | Browse and accept requests, complete deliveries, view task history, join NGOs |
| **NGO** | Manage volunteers, assign tasks, publish community events, view platform stats |
| **Admin** | Full user management, NGO approvals, flagged reports, activity monitoring |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

> © 2024 ElderConnect. All rights reserved.
