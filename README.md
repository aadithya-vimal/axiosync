<div align="center">
  <h1>⚡ Axiosync</h1>
  <p><strong>Proactive AI Health Companion</strong></p>
  <p>Real-time 3D body visualization · Local AI inference · Cloud-synced health data</p>
  <br/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?style=flat-square&logo=firebase" />
  <img src="https://img.shields.io/badge/Three.js-3D%20Body%20Map-green?style=flat-square&logo=threedotjs" />
  <img src="https://img.shields.io/badge/WebLLM-On--device%20AI-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" />
</div>

---

## What is Axiosync?

Axiosync is a **premium, proactive health companion** built for the modern person. Unlike passive tracking apps, Axiosync actively visualizes the impact of your lifestyle choices on your body in real time — utilizing an **ultra-realistic 3D human anatomy engine** that maps muscular exhaustion, metabolic stress, and recovery.

Powered by a massive **500+ exercise Smart Workout Engine**, the app auto-generates deeply customized routines and runs all complex AI inference **locally in your browser** via WebLLM, meaning your health data is never sent to a third-party AI server. Your data is synced securely to **Firebase** so it's available across all your devices, with full control to delete all your footprints at any time.

---

### 🫁 Ultra-Realistic 3D Body Heatmap
An anatomically accurate, hyper-realistic 3D human render reacts to your health data in real time:
- **Muscular Exhaustion** — dynamically glowing hotspots over perfectly mapped muscles
- **Lung stress** — red/orange glow after logging smoking
- **Liver burden** — amber glow after logging alcohol
- **Optimal state** — emerald aura when nutrition goals are met

### 🏋️ Smart Workout Engine
- Powered by a massive **500+ no-equipment / bodyweight exercise database**
- Auto-generates structured routines based on duration, intensity (RPE), training style (HIIT, Hypertrophy, Flow, Yielding Isometrics), and focus.
- Automatically calculates total volume, tracks sets/reps, and plots a 7-day rolling volume bar chart.
- Includes an **Interactive Activity Calendar** with multi-day heatmaps and specific log pop-ups.

### 🏃 Activity Logger
Track 12+ activity types:
| 🏃 Run | 🚶 Walk | 🚴 Cycle | 🏊 Swim | 🥾 Trek | 🏔️ Hike |
|--------|---------|---------|---------|---------|---------|
| 🧗 Climb | 🔥 HIIT | 🛶 Row | ⛷️ Ski | 🧘 Yoga | ⚡ Other |

Log duration, distance, heart rate, elevation, and calories. Activity breakdown shown as a rich donut chart.

### ⚖️ Body Metrics & BMI
- Log weight + height → instant BMI calculation
- Color-coded BMI scale (Underweight → Obese)
- Trend line chart across all measurements
- AI-driven health guidance per BMI category

### 🍽️ Meal Snap & Log
- Drag-and-drop food photos or describe your meal
- WebLLM estimates calories, protein, carbs, fat, and ingredients
- Log meals directly to Firestore

### 😴 Sleep & Circadian
- Log sleep/wake times with a quality slider
- 7-day sleep area chart
- Auto-calculates optimal light exposure, caffeine cutoff, and sleep window

### 🧠 AI Health Coach
- Powered by SmolLM2-1.7B running 100% on-device via WebLLM
- Streaming responses with your health data baked into context
- Suggested prompts and chat history

---

## Architecture

```
axiosync-app/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main dashboard (sidebar + mobile nav + 8 sections)
│   │   ├── login/page.tsx      # Google Sign-In page
│   │   ├── layout.tsx          # AuthProvider, Inter font, metadata
│   │   └── globals.css         # Navy design system, tokens, mobile utilities
│   ├── components/
│   │   ├── BodyMap3D.tsx       # Real GLTF Xbot model + dynamic material shaders
│   │   ├── WorkoutTracker.tsx  # Exercise library, sets/reps, weekly chart
│   │   ├── ActivityLog.tsx     # 12 activity types, donut chart, history
│   │   ├── BodyMetrics.tsx     # BMI calculator, trend chart, scale bar
│   │   ├── AIChat.tsx          # Streaming chat with health context
│   │   ├── MealSnap.tsx        # Photo upload, WebLLM analysis, macro log
│   │   ├── ToxinLogger.tsx     # Smoking/alcohol logger (updates body map)
│   │   ├── SleepLogger.tsx     # Sleep times + quality
│   │   ├── CircadianChart.tsx  # 7-day sleep area + timing windows
│   │   ├── NutrientTracker.tsx # Micro-nutrient goals and progress
│   │   └── LLMStatus.tsx       # WebLLM engine status badge
│   ├── contexts/
│   │   └── AuthContext.tsx     # Google Sign-In, onAuthStateChanged
│   ├── hooks/
│   │   └── useWebLLM.ts        # SmolLM2 engine, streaming, meal analysis
│   └── lib/
│       ├── firebase.ts         # Firebase app init (Auth + Firestore + env vars)
│       └── firestore.ts        # Typed helpers for 7 Firestore collections
└── public/
    └── models/
        └── human.glb           # Xbot rigged human model (Three.js examples, MIT)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Auth | Firebase Authentication (Google) |
| Database | Firebase Firestore (7 collections per user) |
| 3D Rendering | React Three Fiber + Drei, Three.js |
| 3D Model | Xbot.glb (MIT, Three.js examples) — ~2.9MB |
| Local AI | @mlc-ai/web-llm (SmolLM2-1.7B, SharedArrayBuffer) |
| Charts | Recharts (Bar, Line, Area, Pie) |
| Styling | Custom CSS design system (navy tokens, mobile-first) |
| Animations | Framer Motion |
| Utils | date-fns |

---

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Enable **Authentication** → Sign-in method → **Google**
3. Enable **Firestore Database** → Start in production mode
4. Go to Project Settings → Copy your config keys

### 2. Environment

```bash
cp .env.local.example .env.local
# Fill in your Firebase credentials
```

### 3. Run

```bash
cd axiosync-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with Google and you're ready.

> **Note on AI Engine:** Click "Load AI Engine" in the sidebar to download SmolLM2 (~1GB, cached after first load). This is completely optional — all other features work without it.

---

## Privacy

- **Health data** — stored in your Firestore account, accessible only to you
- **AI inference** — SmolLM2 runs entirely in your browser via Web Workers. Zero data sent to external AI servers
- **Authentication** — Google OAuth via Firebase. No passwords stored

---

## Firestore Schema

```
users/{uid}/
  profile/main          → name, email, goals
  logs_nutrition/{id}   → meal, calories, macros, micros
  logs_toxins/{id}      → type, quantity, timestamp
  logs_sleep/{id}       → duration, quality, sleep/wake times
  logs_workout/{id}     → exercises, sets/reps/weight, volume
  logs_activity/{id}    → type, duration, distance, HR, elevation
  body_metrics/{id}     → weight, height, BMI, category
  ai_insights/{id}      → cached AI responses
```

---

<div align="center">
  <sub>Developed by <strong>Aadithya Vimal</strong> · 2025</sub><br/>
  <sub>Built with Next.js · Firebase · Three.js · WebLLM · TypeScript</sub>
</div>
