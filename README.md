# Applyo

Applyo is a privacy-focused, local-first web application designed for managing, tracking, and automating job applications. Built with React, TypeScript, and Vite, Applyo integrates local file system storage with multi-provider AI capabilities to help applicants track job listings, parse job requirements, and generate tailored cover letters and resumes.

## Key Features

### Job Application Tracking
- **Kanban and Board Views**: Track application statuses through configurable workflow stages (Interested, Applied, Response Received, Interviewing, Offer, Rejected).
- **Comprehensive Job Data**: Store details such as company name, position title, key tasks, qualifications, salary estimates, work locations, and entry-level/experience requirements.
- **Document Attachment Management**: Keep cover letters, resumes, certificates, and notes organized per job application.

### Local-First and Privacy-Oriented Storage
- **File System Access API Integration**: Directly manages user files on local storage, organizing data into clean folder hierarchies (`Company Name/Job Title/metadata.json`).
- **IndexedDB and LocalStorage Fallback**: Ensures functionality across browsers by falling back to indexed storage when local directory access is unavailable.
- **Progressive Web App (PWA)**: Supports offline access and desktop installation.

### AI Assistance and Automated Document Generation
- **Multi-Provider LLM Integration**: Supports Google Gemini, Anthropic Claude, OpenAI, and custom OpenAI-compatible endpoints (such as local Ollama or LM Studio models).
- **Automated Job Parsing**: Extracts key details, duties, and candidate requirements directly from unstructured job posting text or URLs.
- **Tailored PDF Generation**: Generates customized cover letters and tailored resumes targeted to specific job postings, exporting directly to PDF.
- **Interactive Context-Aware AI Assistant**: Embedded assistant drawer to draft correspondence, analyze job fit, or answer application questions.

## Technology Stack and Architecture

Applyo is built as a single-page application prioritizing privacy and performance:

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & UI**: Custom CSS, Lucide React icons
- **Document Export**: `html2pdf.js`, `pdfjs-dist`
- **Data Persistence**: Web File System Access API, `idb` (IndexedDB helper)
- **Optional CORS Proxy**: Dedicated Node.js express proxy (`cors-proxy/`) for handling requests to local or custom LLM endpoints without CORS restrictions.

## Prerequisites

- **Node.js**: Version 18.0 or higher
- **Package Manager**: npm 9.0+ (or yarn / pnpm)
- **Browser**: Chromium-based browser (Google Chrome, Microsoft Edge, Brave, Opera) recommended for full File System Access API features.

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourname/applyo.git
cd applyo
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

### Production Build

To construct an optimized production build:

```bash
npm run build
npm run preview
```

## CORS Proxy Setup

When connecting to local AI models (e.g., Ollama or LM Studio) or third-party endpoints that block cross-origin requests from web browsers, use the provided CORS proxy.

Navigate to the `cors-proxy` directory and start the server:

```bash
cd cors-proxy
npm install
npm start
```

Or deploy using Docker Compose:

```bash
docker-compose up -d
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Launches Vite in development mode |
| `npm run build` | Compiles TypeScript and creates a production bundle in `dist/` |
| `npm run preview` | Preview the built production application locally |
| `npm run lint` | Evaluates code with ESLint |

## License

This project is open-source under the MIT License.
