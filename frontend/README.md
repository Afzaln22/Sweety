# Sweety — Frontend Application

A clean, responsive React Single-Page Application (SPA) designed to track blood glucose readings, calculate glycemic trends, and display clinical reports.

## Tech Stack
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Visualizations**: Recharts

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
If running against a remote backend or non-default port, create `.env`:
```bash
VITE_API_URL=http://localhost:5000/api
```
*(By default, Vite proxies `/api` requests to `http://localhost:5000`)*

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```
Build output is saved to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

