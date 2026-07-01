# FitTrack AI - Personal Nutrition & Weight Loss Tracker (MERN + AI)

FitTrack AI is a production-ready, full-stack personal nutrition, weight loss, and muscle mass tracker. It features a vision AI engine that scans meal photos to estimate calories/macros, an interactive AI dietitian coach, automated nightly audits, and downloadable PDF progress reports.

---

## Technical Architecture

* **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router v6, Axios, TanStack Query, React Hook Form, Zod, Framer Motion, and Recharts.
* **Backend**: Node.js, Express, TypeScript, JWT (Access + Refresh tokens rotation), Multer, Cloudinary, Node-Cron, PDFKit, and Winston logging.
* **Database**: MongoDB (indexes optimized for user, dates, and reports queries).
* **AI Layer**: Google Generative AI SDK (`gemini-2.5-flash` model for prompt completion and multimodal image-to-macronutrients parsing).

---

## Getting Started

### 1. Requirements
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) v20 or later
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for starting MongoDB container)

### 2. Database Startup
Start the local MongoDB service using Docker Compose:
```bash
docker compose up -d
```
This spins up MongoDB listening on port `27017` with persistent volume mappings.

### 3. Backend Environment Config
Navigate into the `backend/` directory and check `.env`:
```bash
cd backend
# Verify settings or modify:
# GEMINI_API_KEY -> Add Google Gemini Key to unlock Vision image scanning
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET -> Add Cloudinary keys for image uploads
```

> [!NOTE]
> **Zero-Config Mocks Fallback**: If you do not configure a `GEMINI_API_KEY` or `CLOUDINARY` credentials, the backend will automatically fall back to local folder uploads under `public/uploads` and utilize a local heuristic keywords parser to estimate macros (supporting common meals like chicken breast, eggs, white rice, dal, paneer, apple, milk, etc.). This ensures the entire full-stack app is immediately runnable out-of-the-box!
>
> **Mock Email Transporter**: SMTP details are optional. If left blank, verification links and password reset credentials print directly to your Node server terminal console.

---

## Launching the Application

From the root directory of the project, run:

```bash
# 1. Install all dependencies (backend + frontend)
npm run install-all

# 2. Start both servers concurrently in dev mode
npm run dev
```

* **Vite Frontend**: [http://localhost:5173](http://localhost:5173)
* **Express Backend**: [http://localhost:5000](http://localhost:5000)

---

## Testing Guide & Developer Flow

1. **Sign Up**: Navigate to `/register` and create an account. Check the terminal console of the backend server. You will see the verification email printed with a mock verification link.
2. **Verify Account**: Copy the `token` parameter from the console log link, navigate to `/verify-email`, paste it, and verify your profile.
3. **Establish Goals**: Go to `Goal Settings`, enter your heights, target weights (e.g. 70kg), calorie limit (e.g. 1800kcal), and protein goal (e.g. 120g).
4. **Log Meals**: Go to `Meal Logger`. Click "Log a New Meal" and select an image file containing an apple or egg, or type food descriptions in the AI quick add box (e.g., "3 eggs, 1 bowl yellow dal"). The AI resolves the macros.
5. **Log Activity**: Go to `Activity Logger` and log steps walked (e.g., 9,500), sleep duration, water intake, and wellness mood.
6. **Chat with Coach**: Go to `AI Coach Hub` and message the dietitian (e.g. "Suggest high-protein snacks"). Ask the coach to generate a "Day Summary Review" or compile a PDF progress report.
