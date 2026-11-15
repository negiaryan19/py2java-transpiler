# J-Forge: Python to Java Transpiler & API Gateway

[![Next.js 14/15](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.svg)](https://nextjs.org/)
[![Google Gemini 1.5](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-blue?logo=google)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel%20Serverless-black?logo=vercel)](https://vercel.com/)
[![Course](https://img.shields.io/badge/Course-BTIN337%20GenAI%20CIA--P%20(20M)-emerald)](#)

J-Forge is a production-grade, enterprise-ready Python 3.11 to Java 17 LTS AST Transpiler and REST API Gateway designed for the **BTIN337 GenAI Applications Continuous Internal Assessment Practical (CIA-P)** examination (20 Marks).

Built with the Next.js App Router, Tailwind CSS, and Google Gemini 1.5 Flash, it features a 3-theme live switcher, dual-pane synchronized code editor, interactive API playground, and asynchronous event-driven webhook dispatcher.

---

## 1. Project Architecture & Directory Layout

```
py2java-transpiler/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── convert/
│   │       │   └── route.js          # Main Transpiler Endpoint (Auth + Gemini + Webhook)
│   │       └── webhook-demo/
│   │           └── route.js          # Mock Webhook Receiver for live evaluation
│   ├── components/
│   │   ├── Navigation.jsx            # App view switcher & live theme toggle
│   │   ├── TranspilerStudio.jsx      # Dual-pane code editor (Python -> Java)
│   │   ├── ApiPlayground.jsx         # Interactive REST client for testing POST /api/v1/convert
│   │   ├── WebhookInspector.jsx      # Live event logs and HTTP status delivery table
│   │   ├── DocumentationView.jsx     # CIA-P rubric compliance, .env generator, cURL docs
│   │   └── AstTypeBar.jsx            # AST syntax mapping indicators
│   ├── globals.css                   # Tailwind directives and theme variables
│   ├── layout.jsx                    # Root layout with metadata and fonts
│   └── page.jsx                      # Main client page orchestrating the 4 views
├── lib/
│   ├── auth.js                       # API Key validation logic (x-api-key header check)
│   ├── gemini.js                     # Direct @google/genai client with deterministic prompt
│   └── webhook.js                    # Robust webhook dispatcher with timeout and delivery logs
├── .env.example                      # Public template showing GEMINI_API_KEY and APP_API_KEY
├── .env.local                        # Git-ignored local environment secrets
├── .gitignore                        # Strict rules ignoring node_modules, .next, and .env*
├── next.config.mjs                   # Next.js build configuration
├── package.json                      # All required dependencies, scripts, and devDependencies
├── postcss.config.mjs                # PostCSS configuration for Tailwind
├── tailwind.config.js                # Tailwind CSS custom themes and font definitions
└── README.md                         # Complete project documentation, architecture, and setup guide
```

---

## 2. Academic CIA-P Evaluation Rubric Mapping (20 Marks)

| Requirement | Description | Implementation Status | Component / File |
|:---|:---|:---:|:---|
| **1. Application Development** | Python 3.11 to Java 17 LTS dual-pane studio with dynamic AST pill mappings and 6 presets. | **READY (100%)** | `app/components/TranspilerStudio.jsx`, `AstTypeBar.jsx` |
| **2. Vercel Hosting** | Deployable on Vercel Serverless / Edge with zero external runtime dependencies. | **READY (100%)** | `next.config.mjs`, `package.json` |
| **3. Direct Gemini API** | Uses Google Gemini 1.5 Flash via `@google/genai` with deterministic temperature (0.1). | **READY (100%)** | `lib/gemini.js` |
| **4. Exported REST API** | `POST /api/v1/convert` accepting `{ python_code, webhook_url }` with standard JSON responses. | **READY (100%)** | `app/api/v1/convert/route.js` |
| **5. Webhook Notifications** | Asynchronous HTTP POST event dispatching with HMAC signature headers & 6s timeout. | **READY (100%)** | `lib/webhook.js`, `app/components/WebhookInspector.jsx` |
| **6. API Key Authentication** | Protected endpoint using `x-api-key` header middleware returning HTTP 401 on failure. | **READY (100%)** | `lib/auth.js` |
| **7. Zero Hardcoded Keys** | All API keys and secrets stored strictly in `.env.local` and loaded via `process.env`. | **READY (100%)** | `.env.example`, `.env.local`, `.gitignore` |

---

## 3. Getting Started & Local Installation

### Prerequisites
- Node.js `v18.17.0` or higher (Tested on Node `v24.x`)
- npm `v9.x` or higher

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
GEMINI_API_KEY="AIzaSy_YOUR_GOOGLE_AI_STUDIO_KEY"
APP_API_KEY="ciap-secret-key-2026"
WEBHOOK_SECRET="whsec_btin337_ciap_99481a"
DEFAULT_WEBHOOK_URL="https://webhook.site/your-uuid-here"
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. API Documentation: `POST /api/v1/convert`

### Request Headers
| Header | Value | Description |
|:---|:---|:---|
| `Content-Type` | `application/json` | Request encoding |
| `x-api-key` | `ciap-secret-key-2026` | Mandatory authentication header |

### Request Body (JSON)
```json
{
  "source_language": "python",
  "target_language": "java",
  "java_version": "17",
  "python_code": "def square(x: int) -> int:\n    return x * x\n\nprint(square(9))",
  "webhook_url": "https://webhook.site/ciap-btin337-receiver"
}
```

### Success Response (`200 OK`)
```json
{
  "status": "success",
  "http_code": 200,
  "event": "code.conversion.completed",
  "timestamp": "2026-11-15T12:00:00.000Z",
  "engine": "gemini-1.5-flash",
  "summary": "Synthesized via Google Gemini 1.5 Flash API (Java 17 LTS).",
  "data": {
    "source_language": "python",
    "target_language": "java",
    "java_version": "17",
    "execution_time_ms": 42,
    "java_code": "package com.jforge.ciap;\n\npublic class Solution {\n    public static Object square(Object x) {\n        return x * x;\n    }\n    public static void main(String[] args) {\n        System.out.println(square(9));\n    }\n}"
  },
  "webhook_delivery": {
    "dispatched": true,
    "target_url": "https://webhook.site/ciap-btin337-receiver",
    "delivery_id": "wh_a7b9c1d",
    "status_code": 200,
    "ok": true
  }
}
```

### Error Responses
- **`400 Bad Request`**: Missing, empty, or malformed `python_code`.
- **`401 Unauthorized`**: Missing or invalid `x-api-key` header.
- **`500 Internal Error`**: Unhandled compilation or LLM timeout exception.

---

## 5. Testing with cURL

### Scenario 1: Valid Transpilation (HTTP 200)
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Content-Type: application/json" \
  -H "x-api-key: ciap-secret-key-2026" \
  -d '{
    "python_code": "def factorial(n: int) -> int:\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nprint(factorial(5))",
    "webhook_url": "http://localhost:3000/api/v1/webhook-demo"
  }'
```

### Scenario 2: Unauthorized Request (HTTP 401)
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"python_code": "print(1)"}'
```

### Scenario 3: Bad Request (HTTP 400)
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Content-Type: application/json" \
  -H "x-api-key: ciap-secret-key-2026" \
  -d '{"python_code": "   "}'
```

---

## 6. Vercel Deployment Instructions

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Next.js 14 App Router refactoring for CIA-P evaluation"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `APP_API_KEY`: `ciap-secret-key-2026`
   - `WEBHOOK_SECRET`: `whsec_btin337_ciap_99481a`
5. Click **Deploy**. Vercel will build and deploy the application within ~45 seconds.

---

## 7. License & Authorship
- **Author:** Aryan Negi
- **Course:** Gen AI Applications (BTIN337)
- **Program:** B.Tech CSE (AI & ML), Batch 2025–29
- **Institution:** School of Engineering and Technology
