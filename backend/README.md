# Sweety — Backend API

RESTful API backend for Sweety Blood Glucose Tracker built with Node.js, Express, and PostgreSQL (with zero-configuration persistent fallback).

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL / Dual-Mode Store
- **Authentication**: JWT & Bcrypt password hashing
- **Testing**: Jest & Supertest

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration connects to PostgreSQL at `localhost:5432` with database `sweety_db`. If PostgreSQL is not active, the server seamlessly uses the local persistent store in `backend/data/`.

### 3. Run Migrations & Seed Demo Data
```bash
npm run migrate
npm run seed
```
Demo patient account:
- **Email**: `alex.morgan@example.com`
- **Password**: `Password123!`

### 4. Run Development Server
```bash
npm run dev
```
The API will run on `http://localhost:5000`.

### 5. Run Test Suite
```bash
npm test
```
Executes all validation and report statistical calculation unit tests.

