# 🏛️ Senate Bot Administrator — Feature List

> AI-powered Digital Governance Platform | Gemini AI + Supabase + React + Vite

---

## 🎙️ Voice & Language

| Feature | Detail |
|---|---|
| **Voice Input** | Tap 🎤 Mic button — bot auto-sends after recognising speech |
| **Multilingual Voice** | Speaks in Hindi (`hi-IN`), Marathi (`mr-IN`), or English (`en-IN`) |
| **Text-to-Speech (TTS)** | Bot reads all responses aloud via browser speech synthesis |
| **TTS ON by default** | Speaker 🔊 button glows & pulses when active; click to mute |
| **Language Switcher** | Topbar dropdown: EN / HI / MR — all bot messages switch language |
| **System-level translation** | Gemini systemInstruction rebuilt per-request in selected language |
| **Workflow translation** | Step-by-step prompts (e.g. "Enter Aadhaar") translated via Gemini |

---

## 🤖 AI Chat Assistant

| Feature | Detail |
|---|---|
| **Gemini 2.5 Flash** | Powered by Google Gemini with intent detection |
| **Income Certificate Flow** | 4-step guided application (name → Aadhaar → address → income) |
| **Birth Certificate Flow** | 6-step guided application (child details → parents → address) |
| **Grievance Filing Flow** | 2-step flow (department → complaint description) |
| **Status Tracking** | "Check my status" fetches all applications + grievances at once |
| **Escalation** | Say "I disagree" or "Talk to officer" → escalates to senior officer |
| **AI Approval Explanation** | Bot explains approval/rejection with income thresholds |
| **Scheme PDF via Chat** | Ask about any scheme → AI generates PDF automatically |
| **Professional Tone** | Namaste greetings, formal polite language throughout |
| **Hackathon Demo Button** | Auto-runs full workflow demo with realistic delays |
| **Clear Chat** | Reset conversation and workflow at any time |

---

## 📋 Complaints & Grievances Page

| Feature | Detail |
|---|---|
| **Unified View** | Merges `complaints` table (direct) + `grievances` table (via chat) |
| **Source Badge** | Shows "🤖 via Chat" vs "📝 Direct" on each item |
| **Filter Tabs** | All / Via Chat / Direct |
| **Stats Row** | Total Filed / Pending / Escalated / Resolved counts |
| **Escalate Button** | One-click escalation for Pending/Submitted complaints |
| **Expandable Description** | "Read more / Show less" for long complaint text |
| **Demo Mode** | Shows 3 sample complaints when logged in as Demo User |

---

## 📂 My Applications Page

| Feature | Detail |
|---|---|
| **Live Supabase Data** | Fetches real applications for logged-in user |
| **Demo Mode** | Shows 4 pre-seeded sample applications instantly |
| **Status Badges** | Colour-coded: Approved ✅ / Pending ⏳ / Rejected ❌ / Escalated 🚨 |
| **Document Upload** | Upload supporting docs via Supabase storage |
| **Escalate Button** | Escalate any Pending application to senior officer |

---

## 📚 Scheme Explorer

| Feature | Detail |
|---|---|
| **8 Major Schemes** | PMAY · PM Kisan · Ayushman Bharat · Swachh Bharat · BBBP · MUDRA · Digital India · Skill India |
| **Hardcoded Rich Data** | Full benefits, eligibility, documents, steps, budget for all 8 schemes |
| **PDF Always Downloads** | Browser-local PDF generation with jsPDF — works even if Gemini is offline |
| **Gemini Enhancement** | Tries Gemini for richer/translated data (15s timeout); falls back gracefully |
| **Dark / Light PDF Theme** | Choose navy-dark or white-light themed PDF with preview |
| **PDF Languages** | Generate PDF in English, Hindi (हिंदी), or Marathi (मराठी) |
| **Download History** | Downloaded PDFs appear in history immediately with "Save again" button |
| **Supabase Cloud Save** | PDFs also uploaded to Supabase storage when available |
| **Search** | Filter schemes by name or description |

---

## 🧠 Smart Insights Page

| Feature | Detail |
|---|---|
| **Eligibility Checker** | Fill income/age/farmer/student fields → instant ✅/✗ for 5 schemes |
| **Schemes Checked** | PMAY · PM Kisan · Ayushman Bharat · NSP Scholarship · PMSBY |
| **Proactive Alerts** | 4 time-sensitive reminders (PM Kisan instalment, scholarship deadline, etc.) |
| **AI Prediction Card** | "You may be eligible for 3 more schemes" AI insight |
| **Scheme Analytics** | Demand bar charts for 5 schemes with % and trend |
| **Transparency Stats** | National approval rate, avg processing time, escalated cases |
| **Government Forecast** | AI predicts 35% higher demand for Q2 2026 |

---

## 📊 Dashboard

| Feature | Detail |
|---|---|
| **Live Stats** | Total applications, complaints, scheme PDFs, escalated cases |
| **Demo Mode Banner** | "🎬 Demo Mode" badge with pre-seeded statistics |
| **Account Details** | Aadhaar, income, district, state display |
| **Recent Activity** | Latest applications and complaints shown |

---

## 🌗 Theme & UI

| Feature | Detail |
|---|---|
| **Dark / Light Theme** | Sun/Moon toggle in Topbar — applies globally |
| **Theme Persistence** | Saved to `localStorage` — survives page refresh |
| **Smooth Transitions** | CSS transitions on all surfaces (250ms ease) |
| **Responsive Layout** | Sidebar + Topbar shell, works at various screen sizes |
| **Glassmorphism Cards** | Frosted-glass card components with subtle borders |
| **Micro-animations** | Fade-in, slide-up, pulse, spin animations throughout |

---

## 🔐 Authentication

| Feature | Detail |
|---|---|
| **Supabase Auth** | Email + OTP-based login |
| **Demo Login** | Bypass OTP — instant access with pre-loaded sample data |
| **Protected Routes** | All pages require authentication (or demo mode) |
| **Session Persistence** | Supabase session stored; auto-login on refresh |

---

## ⚙️ Technical Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | TailwindCSS v4 + custom CSS variables |
| **AI** | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| **Backend / DB** | Supabase (PostgreSQL + Storage + Auth) |
| **PDF Generation** | jsPDF (client-side, no server needed) |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Icons** | Lucide React |
| **Toasts** | react-hot-toast |

---

## 🗄️ Supabase Tables

| Table | Purpose |
|---|---|
| `applications` | Income / caste / residence certificate applications |
| `complaints` | Direct complaints filed |
| `grievances` | Grievances filed via the AI Chat |
| `schemes` | Generated scheme PDF records |
| `birth_certificate_applications` | Birth certificate applications |

---

*Built for hackathon demo · Senate Bot Administrator · February 2026*
