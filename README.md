# 🏹 PocketYodha — Train Your Money Mind

> **A Gamified Financial Literacy & Expense Tracking for Students and Young Adults**

![PocketYodha Banner](https://img.shields.io/badge/PocketYodha-Financial%20RPG-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)


---

## 🎮 What is PocketYodha?

PocketYodha is a **Solo Leveling-inspired RPG** where your real financial decisions = your character's progression.

- Log a smart expense → **+XP**
- Resist an impulse buy → **+Discipline XP**
- Get scammed → **−HP 💀**
- Win a Decision Battle → **Level Up**

No more boring budget apps. Every rupee you spend or save has **real in-game consequences**.

---

## ✨ Features

### 🧠 Core Gameplay Loop
| Feature | Description |
|---|---|
| **Hunter Profile** | Personalized RPG character with avatar, XP, HP, level & title |
| **Expense Logger** | Voice / Manual / Camera (OCR) — 3 ways to log expenses |
| **ML Classifier** | Auto-classifies expenses as Need / Want / Trap |
| **Decision Battle** | Fight demons (FOMO, Scam, Impulse) — make the right choice |
| **Skill Tree** | 13 unlockable financial abilities across 5 tiers |
| **Quests & Goals** | Personalized savings goals with daily/weekly missions |
| **Scam Trial** | 7 real-world fraud scenarios — UPI scam, phishing, fake lottery |
| **Finance Games** | Quiz, Budget Puzzle, Money Memory |
| **Weekly Review** | Habit score, spending donut chart, meme nudges, battle record |

### ⚡ Gamification System
- 20 level titles: *Broke Beginner → Shadow Monarch*
- 22 achievements across Easy / Medium / Hard / Secret tiers
- Daily streak system with Comeback Bonus
- Variable reward rolls (5% jackpot XP chance)
- XP popups, damage numbers, confetti, level-up reveals

### 🛡️ Scam Vision Module
- UPI collect scam detection
- Phishing email identification
- Fake lottery & investment fraud
- OTP scam awareness
- Combo multiplier + 3-lives system

---

## 🏗️ Tech Stack

### Frontend
```
React 18 + Vite 5        — SPA framework
Zustand 5                — Global state management
React Router v6          — Client-side routing
CSS Variables + Keyframes — Dark RPG design system
Web Speech API           — Voice expense input
Tesseract.js             — In-browser OCR (receipt scan)
Chart.js                 — Analytics charts
```

### Backend
```
Python 3.14              — Runtime
Flask 3.x                — REST API framework
Flask-CORS               — Cross-origin support
SQLite                   — Local database (no server needed)
Pytesseract              — Server-side OCR
Pillow                   — Image processing
```

### Design
```
Font: Rajdhani (display) + DM Sans (body)
Theme: Dark Navy (#060818) + Purple (#c084fc) + Gold (#fbbf24)
Animations: 25+ CSS keyframes
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) (Windows) / `brew install tesseract` (Mac) / `sudo apt install tesseract-ocr` (Linux)

---

### Frontend Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/pocketyodha.git
cd pocketyodha/finquest

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

### Backend Setup

```bash
# 1. Go to backend folder
cd backend

# 2. Install Python dependencies
pip install flask flask-cors pytesseract Pillow

# 3. Windows only — add tesseract path in app.py (already configured)
# C:\Program Files\Tesseract-OCR\tesseract.exe

# 4. Start backend
python app.py
# Runs at http://localhost:5000
# SQLite DB auto-created: backend/pocketyodha.db
```

---

## 📁 Project Structure

```
pocketyodha/
├── finquest/                    # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Hunter HQ + HUD
│   │   │   ├── Register.jsx     # Onboarding (3 steps)
│   │   │   ├── Profile.jsx      # Hunter profile + badges
│   │   │   ├── ExpenseCapture.jsx # Log expenses (3 modes)
│   │   │   ├── Battle.jsx       # Decision battle arena
│   │   │   ├── SkillTree.jsx    # 13-skill RPG tree
│   │   │   ├── Review.jsx       # Weekly report card
│   │   │   ├── Quests.jsx       # Goals + missions
│   │   │   ├── Games.jsx        # Finance mini-games
│   │   │   └── ScamTrial.jsx    # Fraud detection game
│   │   ├── components/
│   │   │   └── GameFX.jsx       # XP/damage/confetti effects
│   │   ├── store/
│   │   │   ├── userStore.js     # Zustand global state
│   │   │   └── gameEngine.js    # XP, levels, achievements
│   │   ├── api.js               # Backend API connector
│   │   └── App.jsx              # Router
│   └── package.json
│
├── backend/                     # Python Flask Backend
│   ├── app.py                   # Main Flask application
│   ├── requirements.txt         # Python dependencies
│   └── pocketyodha.db          # SQLite DB (auto-generated, gitignored)
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/classify` | Classify expense (Need/Want/Trap) |
| `POST` | `/api/expenses` | Log expense + auto-classify |
| `GET` | `/api/expenses/:userId` | Get user expenses |
| `POST` | `/api/user` | Create/update user profile |
| `GET` | `/api/user/:userId` | Load user profile |
| `POST` | `/api/battle` | Log battle result + update XP/HP |
| `GET` | `/api/review/:userId` | Weekly review data + habit score |
| `POST` | `/api/ocr` | Extract text from receipt image |
| `POST` | `/api/achievements` | Save earned achievement |
| `GET` | `/api/achievements/:userId` | Get user achievements |

---

## 🎯 Target Users

| User Type | Age | Income Range | Key Problem |
|---|---|---|---|
| College Students | 16–22 | ₹1,000–₹8,000/mo | Pocket money mismanagement |
| Young Professionals | 22–28 | ₹10,000–₹60,000/mo | Impulse spending + UPI fraud |

---

## 🗃️ Database Schema

```sql
users        — id, name, age, gender, occupation, income, 
               avatar, hunter_name, xp, hp, level, streak,
               save_percent, active_goal

expenses     — id, user_id, amount, description, 
               category, type (need/want/trap), date

battles      — id, user_id, demon, result (win/lose),
               xp_change, hp_change, played_at

achievements — id, user_id, achievement, earned_at
```

---

## 👥 Team

| Member | Role |
|---|---|
| Siddhi Gupta | Frontend Development (React, UI/UX) |
| Mitul Khanna & Vanshika Agarwal | Backend Development (Flask, SQLite) |
| Vandan Maheshwari & Havya Thakar | ML/OCR Integration (Classifier, Tesseract) |

---

## 🏫 Institution

**VIT Bhopal University**<br>
School of Computing Science and Engineering<br>
B.Tech — Computer Science and Engineering<br>
April 2026

---

## 📄 License

This project was built as an academic submission for VIT Bhopal University.

---

<div align="center">
  <strong>Built with ❤️ by Team PocketYodha</strong><br/>
  <em>"Train Your Money Mind"</em>
</div>
