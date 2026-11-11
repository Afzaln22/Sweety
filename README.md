# Sweety — Blood Glucose Tracker (PERN Stack)

A patient-centric blood glucose tracking and reporting web application built with **Node.js, Express, PostgreSQL, and React (Vite + Tailwind CSS)**.

Designed to match professional clinical UX specifications, allowing diabetes patients to log up to 4 readings a day across standard meal slots, monitor glycemic trends, and review daily and monthly statistical reports.

---

## 🌟 Key Features

### 1. Authentication & Secure Tenant Isolation
- **Registration & Login**: Secure user onboarding with name, email, and password.
- **Bcrypt Hashing**: Passwords are encrypted with `bcrypt` (salt rounds = 10); plain text is never persisted.
- **JWT Authorization**: Requests to readings and reports require a valid Bearer token; queries automatically filter by `req.user.id` so patients only see their own medical history.

### 2. Blood Glucose Tracking & Strict Validation Rules
Patients record readings across **4 standardized slots**:
- `Morning (fasting)`
- `After breakfast`
- `After lunch`
- `After dinner`

The application enforces exact business rules with user-friendly error messages:
| Validation Rule | Enforced Condition | UI Error Message |
| :--- | :--- | :--- |
| **Value is required** | Value is missing, null, or blank | `"Please enter a glucose value."` |
| **Value range** | Must be a whole integer between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
| **Unique slot per day** | Reading already exists for `(user_id, date, slot)` | `"You already have an [Slot] reading for this date."` |
| **Maximum 4 per day** | Daily count already equals 4 on creation | `"You can add only 4 readings per day."` |
| **No future dates** | Date > today in local calendar | `"Date cannot be in the future."` |

### 3. Comprehensive Reports Engine
Generates statistical metrics (**Highest**, **Lowest**, **Average rounded to 1 decimal place**, and **Count**) across 3 scopes:
- **Daily Report**: Exactly the selected date, including a breakdown itemizing each slot with its value and recorded time.
- **Month-to-Date (MTD)**: From the 1st of the month to the selected reference date (e.g. `1 Oct – 15 Oct 2026`).
- **Monthly Report**: The full previous calendar month (e.g. `1 Sep – 30 Sep 2026`).
- **Empty State**: Friendly visual state when no readings exist for the selected scope.
- **CSV Export**: One-click download of report records.

### 4. Interactive Charts & Bonus Tasks
- **Glucose Trend Chart**: 7-day trend visualization using **Recharts**.
- **Pagination**: Server-side pagination on `GET /api/readings?page=1&limit=20`.
- **Docker Compose**: Containerized multi-service setup (`PostgreSQL`, `API`, `Frontend`).
- **Automated Test Suite**: Unit and integration tests verifying all 5 validation rules, error strings, and report calculation rounding.

---

## 📐 Assumptions & Design Decisions

As recommended in the assignment guidelines (*"Write down your assumption in the README and move on. We value clear reasoning over a perfect result."*), here are the documented design decisions:

1. **Slots Definition**:
   - The 4 slots are strictly constrained to: `Morning (fasting)`, `After breakfast`, `After lunch`, and `After dinner`.
   - The unique constraint `UNIQUE (user_id, reading_date, slot)` at the PostgreSQL database level naturally protects against duplicate slots, reinforced by application-level validation.
2. **Reference Date Default**:
   - The demo defaults to reference date `2026-10-15` to match the exact dates and seed data illustrated in the Figma design, while allowing the user to pick any historical date.
3. **Clinical Target Thresholds**:
   - Status indicators categorize glucose values into:
     - **Within range**: 70 – 140 mg/dL (Normal fasting & post-meal)
     - **Review trend**: 141 – 180 mg/dL (Elevated)
     - **High**: > 180 mg/dL
     - **Low**: < 70 mg/dL

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

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) OR Docker Desktop

### Option A: Running with Docker Compose (Recommended)

1. Clone and navigate to the project directory:
   ```bash
   git clone https://github.com/Afzaln22/Sweety.git
   cd Sweety
   ```
2. Start the full stack with Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Open your browser:
   - Frontend UI: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api/health`

---

### Option B: Running Locally

#### 1. Setup Backend:
```bash
cd server
cp .env.example .env
npm install
npm run migrate   # Run database migrations
npm run seed      # (Optional) Seed demo user Alex Morgan & sample readings
npm run dev       # Starts API server on port 5000
```

#### 2. Setup Frontend:
```bash
cd client
npm install
npm run dev       # Starts Vite dev server on port 3000
```

Open `http://localhost:3000` in your browser.

**Demo Credentials (if seeded):**
- **Email:** `alex.morgan@example.com`
- **Password:** `Password123!`

---

## 🧪 Running Automated Tests

Run the backend validation and reporting test suite:
```bash
npm --prefix server test
```

Test output verifies:
- All 5 validation rules & exact error strings.
- Max, min, count, and average calculation rounded to 1 decimal place.
- Date ranges for Daily, Month-to-date, and Previous month.
- Empty state handling.

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
