# Sweety — Blood Glucose Tracker

A patient-centric blood glucose tracking and reporting web application built with the **PERN Stack** (**P**ostgreSQL, **E**xpress.js, **R**eact 18, and **N**ode.js).

> **Architectural Note (MERN vs. PERN):**  
> As specifically required by the assignment specification (*"You will build a Node.js + Express API, a PostgreSQL database and a React frontend"*), PostgreSQL is utilized as the relational database engine instead of MongoDB. The remaining architecture follows the standard Express, React, and Node.js stack (the **PERN** pattern).

---

## 🌟 Key Features

### 1. Authentication & Patient Data Isolation
- **Registration & Login**: Secure patient onboarding with name, email, and password.
- **Bcrypt Password Hashing**: Passwords are salted and hashed using `bcrypt` (10 rounds); plain-text passwords are never stored.
- **JWT Authorization**: Requests to readings and reports require a valid Bearer token. All database queries strictly filter by `WHERE user_id = $1` ensuring complete patient data privacy and tenant isolation.

### 2. Blood Glucose Tracking & Strict Validation Rules
Patients record readings across **4 standardized slots**:
- `Morning (fasting)`
- `After breakfast`
- `After lunch`
- `After dinner`

The application enforces exact business validation rules with clear UI feedback:
| Validation Rule | Enforced Condition | UI Error Message |
| :--- | :--- | :--- |
| **Value is required** | Value is missing, null, or blank | `"Please enter a glucose value."` |
| **Value range** | Must be a whole integer between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
| **Unique slot per day** | Reading already exists for `(user_id, date, slot)` | `"You already have an [Slot] reading for this date."` |
| **Maximum 4 per day** | Daily count already equals 4 on creation | `"You can add only 4 readings per day."` |
| **No future dates** | Date is greater than today in local calendar | `"Date cannot be in the future."` |

### 3. Comprehensive Reports Engine
Generates statistical metrics (**Highest**, **Lowest**, **Average rounded to 1 decimal place**, and **Count**) across 3 scopes:
- **Daily Report**: Exactly the selected date, including a slot-by-slot breakdown with recorded timestamps.
- **Month-to-Date (MTD)**: From the 1st of the month to the selected reference date (e.g. `1 Oct – 15 Oct 2026`).
- **Monthly Report**: The full previous calendar month (e.g. `1 Sep – 30 Sep 2026`).
- **Empty State**: Friendly visual state when no readings exist for the selected scope.
- **CSV Export**: One-click download of filtered report records.

### 4. Interactive Charts & Responsive Experience
- **Charts**: Interactive line chart with Recharts showing daily glucose averages over the month and spike highlights (>140 mg/dL).
- **Slot Completion Badges**: Already recorded daily slots are visually disabled (`Done` badge) to prevent accidental duplicate entries, auto-selecting the next available slot.
- **Mobile Responsive**: Fully responsive UI designed for both desktop and mobile phone browsers, including slide-over drawer navigation and a mobile bottom bar.
- **Automated Test Suite**: 10/10 Jest unit and integration tests verifying all validation rules, exact error strings, and report calculation rounding.

---

## 📂 Project Structure

```
Sweety/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Database configuration & dual-mode store
│   │   ├── controllers/      # Auth, Readings, Reports controllers
│   │   ├── db/               # schema.sql, migrate.js, seed.js, reset.js
│   │   ├── middleware/       # JWT auth & validation rules
│   │   ├── routes/           # REST endpoints
│   │   ├── app.js            # Express app configuration
│   │   └── index.js          # API server entry point
│   ├── tests/                # Jest automated test suite (10/10 passing)
│   ├── .env.example          # Database & JWT configuration template
│   ├── Dockerfile            # Standalone backend container
│   ├── package.json          # Backend dependencies & scripts
│   └── README.md             # Backend setup documentation
│
├── frontend/                 # React 18 + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── context/          # Auth context & state management
│   │   ├── pages/            # Dashboard, Readings, Reports, Add/Edit
│   │   ├── services/         # API client with VITE_API_URL support
│   │   ├── App.jsx           # Main routing & layout
│   │   └── index.css         # Tailwind directives & design tokens
│   ├── .env.example          # Frontend configuration template
│   ├── Dockerfile            # Production multi-stage container
│   ├── package.json          # Frontend dependencies & scripts
│   ├── vite.config.js        # Vite dev server & proxy settings
│   └── README.md             # Frontend setup documentation
│
├── docker-compose.yml        # Orchestrates db, backend, and frontend
├── package.json              # Root workspace management scripts (concurrently)
├── .env.example              # Unified environment variables template
└── README.md                 # Full project documentation & notes
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    slot VARCHAR(50) NOT NULL,
    glucose_value INTEGER NOT NULL,
    recorded_at VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_glucose_value CHECK (glucose_value >= 40 AND glucose_value <= 600),
    CONSTRAINT check_slot_valid CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')),
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX idx_readings_user_date ON readings (user_id, reading_date);
CREATE INDEX idx_users_email ON users (email);
```

---

## 🚀 How to Install & Run

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+) OR Docker Desktop

---

### 2. Installation

Clone the repository and install all dependencies:
```bash
# 1. Clone repository
git clone https://github.com/Afzaln22/Sweety.git
cd Sweety

# 2. Install root dependencies (concurrently)
npm install

# 3. Install backend dependencies
cd backend && npm install

# 4. Install frontend dependencies
cd ../frontend && npm install
cd ..
```

---

### 3. Setting Up the Database & Environment

1. Copy `.env.example` to `.env` in the root and in `backend/`:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
2. Verify PostgreSQL credentials in `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety_db
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=postgres
   PGDATABASE=sweety_db
   JWT_SECRET=sweety-super-secret-jwt-key-2026
   ```
3. Run the database migrations:
   ```bash
   npm run migrate
   ```
4. **Seed Demo User & Sample Readings**:
   ```bash
   npm run seed
   ```
   *Creates demo user `alex.morgan@example.com` (`Password123!`) with 21 sample readings across morning, breakfast, lunch, and dinner slots matching the design specification.*

> **Dual-Mode Database Note**: If PostgreSQL is temporarily not running, the application automatically falls back to an embedded persistent JSON store (`backend/data/sweety_db.json`), ensuring evaluation works immediately with zero setup hurdles.

---

### 4. Running the Application

#### Option A: One Command (Recommended)
From the root directory, run both the backend server and frontend client concurrently:
```bash
npm run dev
```
- **Frontend UI**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api/health`

#### Option B: Separate Terminals
- **Run Backend**:
  ```bash
  cd backend
  npm run dev
  # Server starts on http://localhost:5000
  ```
- **Run Frontend**:
  ```bash
  cd frontend
  npm run dev
  # Client starts on http://localhost:3000
  ```

#### Option C: Docker Compose
```bash
docker-compose up --build
```

---

### 5. Running Automated Tests

Run the complete test suite (10/10 tests):
```bash
npm test
```
*(Or `npm --prefix backend test`)*

The Jest test suite verifies:
- All 5 validation rules and exact UI error messages.
- Glucose range enforcement (40 – 600 mg/dL).
- Duplicate slot prevention and 4-per-day limit.
- Future date restriction.
- Statistical calculations (highest, lowest, count, and average rounded to 1 decimal place).
- Empty state handling and multi-month date scoping.

---

## 📝 Notes (Assumptions & What I'd Improve With More Time)

### 📌 Assumptions
1. **Clinical Slots**:
   - The clinical routine defines exactly 4 slots per day: `Morning (fasting)`, `After breakfast`, `After lunch`, and `After dinner`. Each slot can be recorded at most once per calendar day per patient.
2. **Reference Date & Dynamic Date Synchronization**:
   - For demo and evaluation purposes, the seed script populates sample readings for `2026-10-15` (matching the Figma mockups). The frontend dashboard dynamically checks today's date first, falling back smoothly to the latest recorded readings so that both live newly-added entries and seeded prototype entries render seamlessly.
3. **Target Blood Glucose Range**:
   - Clinically standard non-diabetic and well-managed target ranges are applied:
     - **Normal / In Range**: 70 – 140 mg/dL
     - **Review Trend (High / Spike)**: > 140 mg/dL
     - **Low / Dip**: < 70 mg/dL
4. **Tenant Isolation**:
   - Every patient has private, isolated data. All database queries bind `WHERE user_id = $1` derived securely from verified JWT tokens, preventing cross-patient data access.
5. **Resilient Dual-Mode Database Engine**:
   - The backend natively targets PostgreSQL using parameterized SQL queries. If PostgreSQL is not installed or offline on the reviewer's machine, the backend seamlessly switches to a local persistent JSON store (`backend/data/sweety_db.json`), allowing instant full-stack testing without database setup friction.

---

### 🚀 What I'd Improve With More Time
1. **Continuous Glucose Monitor (CGM) Integration**:
   - Integrate OAuth2 connectors for Dexcom (G6/G7) and Abbott FreeStyle Libre APIs to ingest real-time continuous sensor readings, reducing manual patient entry burden.
2. **Clinician & Caregiver Portal (Role-Based Access Control - RBAC)**:
   - Introduce distinct user roles (`PATIENT`, `CLINICIAN`, `CAREGIVER`). Enable endocrinologists to review multi-patient panels, set customized glycemic targets, and add clinical notes to specific spike events.
3. **Automated Reminders & Push Notifications**:
   - Implement background job queues (using BullMQ / Redis) with Web Push and SMS notifications to remind patients 2 hours after meals to log their post-prandial readings.
4. **Estimated HbA1c ($eA1c$) Projection**:
   - Calculate an estimated 90-day HbA1c value based on the American Diabetes Association formula ($eA1c = (46.7 + \text{averageGlucose}) / 28.7$) to give patients long-term clinical visibility.
5. **Export to Doctor-Ready PDF Report**:
   - Implement server-side PDF generation (via Puppeteer or PDFKit) summarizing monthly glucose variability, standard deviation, time-in-range (TIR %), and spike history for clinical consultations.
6. **Progressive Web App (PWA) & Offline Sync**:
   - Add a service worker and IndexedDB offline cache to allow patients to record glucose readings in areas without internet connectivity, auto-syncing when back online.

---

## 🔑 Demo Account Credentials

If the database is seeded (`npm run seed`):
- **Email:** `alex.morgan@example.com`
- **Password:** `Password123!`

To start with a fresh slate without old readings:
```bash
npm run clean:data
```

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register a new patient account (`{ name, email, password }`)
- `POST /api/auth/login` — Sign in and receive a JWT token (`{ email, password }`)
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Readings (Patient Isolated)
- `POST /api/readings` — Create reading (`{ reading_date, slot, glucose_value }`)
- `GET /api/readings` — List readings with filters & pagination (`?page=1&limit=20&slot=...&search=...`)
- `GET /api/readings/:id` — Retrieve a single reading by ID
- `PUT /api/readings/:id` — Update reading details
- `DELETE /api/readings/:id` — Delete reading

### Reports & Trends
- `GET /api/reports?date=YYYY-MM-DD` — Daily, Month-to-date, and Previous month statistics
- `GET /api/reports/trend?date=YYYY-MM-DD` — 7-day glucose trend data for charts
- `GET /api/health` — System health check
