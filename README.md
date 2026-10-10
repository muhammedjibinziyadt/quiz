# MAERIKA 2K26 Arts Fest — Live Quiz Competition Platform

A production-ready, full-stack live quiz competition website engineered for **MAERIKA 2K26 Arts Fest**, featuring the signature Malayalam cultural quiz **“നാട്ടറിവ് QUIZ 2026”**.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB Atlas with Mongoose**, **Pusher Channels**, **Zod**, and **Recharts**.

---

## 🎨 Branding & Cultural Heritage

The platform preserves and prominently showcases the two official assets located in `public/images/`:
1. **`maerika-arts-fest-logo.png`**: The MAERIKA 2K26 Arts Fest emblem (featuring the arched portal, eternal flame, crossbeam arch, and sword).
2. **`nattarivu-quiz-logo.png`**: The regional cultural quiz identity **“നാട്ടറിവ് QUIZ 2026”** rendered in traditional typography with Malayalam font support via Google Fonts (`Noto Sans Malayalam` & `Plus Jakarta Sans`).

---

## 🚀 Key Features

### 1. Student Access-Code Authentication (`/student/login`)
- **No Self-Registration**: Students cannot create accounts or tamper with their identities.
- **Cryptographic Access Codes**: Each code (e.g. `MK-ABHI-2026`) is generated cryptographically by the admin and hashed using HMAC-SHA256 in MongoDB.
- **Secure Sessions**: Authenticated students receive HTTP-only, SameSite cookies with JWT sessions.

### 2. High-Stakes Quiz Runner (`/student/quiz/[quizId]`)
- **Server-Authoritative Clock**: Attempt deadlines are calculated and enforced by the server (`startTime + durationSeconds`). Browser clock tampering cannot bypass deadlines.
- **Auto-Submission**: Attempts auto-submit cleanly when the server deadline expires.
- **Continuous Draft Preservation**: Answers auto-save in real-time as options are clicked.
- **Zero Answer Leakage**: Correct options and explanations are completely stripped from API responses until completion.
- **Duplicate Prevention**: Atomic database locks prevent double submissions.

### 3. Strict Student Privacy Enforcement
- **No Leaderboard Access**: Students can **never** view the leaderboard, top scorers, winner names, or other students' marks.
- Enforced strictly on backend API routes (`401/403` checks) — not merely hidden with CSS.

### 4. Admin Live Leaderboard with Pusher Channels (`/admin/leaderboard`)
- **Real-Time Pusher Synchronization**: Instantaneous ranking updates broadcast via Pusher channel `admin-leaderboard-[quizId]`.
- **Top 3 Podium**: Visual 1st (Gold Crown), 2nd (Silver), and 3rd (Bronze) pedestals.
- **Live Ranking Animations**:
  - Students climbing the ranks trigger green badges with upward arrows (`↑ +1`) and pulse animations.
  - Students dropping trigger red downward arrows (`↓ -1`).
  - Stable MongoDB IDs prevent random DOM reshuffling.
- **Interactive Recharts Visualization**: Live bar chart visualizing score distributions.
- **Resilient Fallback**: Seamless polling backup ensures the live leaderboard updates even during local/offline development or network blips.

### 5. Comprehensive Admin Management (`/admin/*`)
- **Overview Dashboard**: Active counts, participant statistics, and audit activity stream.
- **Student Management**: Add, edit, deactivate, regenerate codes, view history, and **Export CSV**.
- **Quiz & Question Builder**: Text-based and Image-based MCQs, file upload to `public/uploads/`, option ordering, negative marking toggles, and version locking.
- **Audit Results & Performance Logs**: Detailed logs and CSV report export.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) with Turbopack |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS with custom glassmorphism & glowing animations |
| **Database** | MongoDB Atlas with Mongoose (with MongoMemoryServer dev fallback) |
| **Realtime** | Pusher Channels (`pusher` server SDK & `pusher-js` client SDK) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Security** | bcryptjs, HMAC-SHA256, JWT in HTTP-only cookies |

---

## ⚙️ Environment Variables

Create `.env.local` based on `.env.example`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/maerika_quiz_2026?retryWrites=true&w=majority
MONGODB_DB=maerika_quiz_2026

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$tSzQLgqBE6Edeukb8nyHqOb4t5VsZefmC8883KxBzg99oLmaP1UjS
SESSION_SECRET=maerika_2k26_arts_fest_super_secure_jwt_session_secret_key_987654321

# Pusher Channels (Optional for local test; app includes seamless fallback)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap2

NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Admin Password Hash
To create a custom secure bcrypt hash for the admin:
```bash
npm run hash:admin your_secret_password
```
Copy the printed `ADMIN_PASSWORD_HASH` into your `.env.local`.

### 3. Seed Database with Questions & Sample Students
Seeds authentic Malayalam questions (“നാട്ടറിവ് QUIZ 2026”), visual emblem questions, and sample participants:
```bash
npm run seed
```

Default credentials seeded:
- **Admin Portal**: `http://localhost:3000/admin/login` (Username: `admin`, Password: `admin123`)
- **Student Entry**: `http://localhost:3000/student/login` (Sample Access Codes: `MK-ABHI-2026`, `MK-DEVI-2026`, `MK-FAYI-2026`)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
Runs node test runner covering scoring, negative marks, access control, server clock clamping, and duplicate protection:
```bash
npm test
```

### 6. Build for Production
```bash
npm run build
```
---

## 🔒 Security & Privacy Guarantees

1. **No Plaintext Passwords or Codes**: Admin passwords and student access codes are hashed before storing.
2. **Never Return Correct Answers Early**: Active quiz endpoints strip `correctOptionId` and `explanation` from payloads.
3. **Server-Side Authorization**: Every administrative API verifies JWT signatures and admin role.
4. **Brute Force Protection**: In-memory rate limiting applied to both `/api/admin/auth/login` and `/api/student/auth/login`.
5. **Private Pusher Broadcasts**: Pusher events fire only after successful database persistence and contain only authorized competition ranks.
