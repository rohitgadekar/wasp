# 🐝 WASP (Workflow Automation & Sanctuary Platform)

> A modern, unified digital workspace engineered for productivity, collaboration, automated reporting, and intelligent developer workflows.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📌 Overview

**WASP** is an enterprise-grade productivity platform designed to eliminate daily operational friction for engineering and operations teams. By combining real-time team collaboration, automated task and productivity reporting, code snippet repositories, internal documentation, leave management, and AI-driven retrieval-augmented generation (RAG), WASP serves as a single source of truth for the entire team.

---

## 📸 Application Showcase

### 1. 👥 Team Activity & Collaboration (Hive)
Keep track of team pulses, active tasks, real-time collaboration updates, and operational highlights across members.

![Team Activity](https://res.cloudinary.com/ipmbe0zp/image/upload/v1794887758/Screenshot_2026-11-17_at_9.25.44_AM.png)

---

### 2. 📅 Leave Management
Manage leave schedules, track leave balances, view team availability calendars, and streamline time-off planning.

![Leave Management](https://res.cloudinary.com/ipmbe0zp/image/upload/v1794887757/Screenshot_2026-11-17_at_9.24.44_AM.png)

---

### 3. 🤖 RAG / AI Chat Assistant
Context-aware AI assistant leveraging Retrieval-Augmented Generation (RAG) to query knowledge bases, generate solutions, analyze team documentation, and share conversation threads.

![RAG / AI Chat](https://res.cloudinary.com/ipmbe0zp/image/upload/v1794887757/Screenshot_2026-11-17_at_9.25.00_AM.png)

---

## 🚀 Key Modules & Capabilities

### 🧠 RAG & AI Intelligence
- **Contextual Knowledge Retrieval**: Search internal guides, documentation, and technical assets via AI embeddings.
- **Interactive Chat Assistant**: Real-time answers, code explanations, and workflow troubleshooting.
- **Sharable Conversations**: Securely export and generate shareable links for AI conversations.

### 🐝 Team Hive & Activity
- **Real-Time Pulse**: Monitor what team members are actively tackling.
- **Collaborative Discussions**: Share quick updates and reduce status check-in meetings.

### 📊 Daily Status & Automated Reporting
- **Streamlined Logging**: Fast input for daily deliverables (New Dev, Updates, Maintenance).
- **Intelligent Productivity Parsing**: Automatically filters non-work items (e.g., leaves, holidays) to maintain clean metrics.
- **One-Click Email Dispatch**: Generates formatted status summaries ready for stakeholders and leadership.
- **Velocity & Analytics**: Interactive charts and performance heatmaps to visualize output over time.

### 🗓️ Leave Management System
- **Interactive Calendar**: Full-team visibility of planned absences, leaves, and holidays.
- **Leave Request & Balances**: Transparent tracking for sick, casual, and earned leaves.
- **Capacity Planning**: Identify sprint coverage gaps before scheduling major deliverables.

### 💻 Code Sanctuary & Snippet Library
- **Centralized Asset Hub**: Searchable repository of reusable scripts, utilities, and components.
- **Syntax Highlighting & Formatting**: Clean code rendering with one-click copy and permalinks.
- **Tag-Based Taxonomy**: Organize snippets by domain, framework, or purpose.

### 🛠️ Developer Utility Suite
- **Side-by-Side Diff Checker**: Rapidly compare snippets, JSON payloads, or configuration files.
- **CSV Visualizer**: Interactive parsing, sorting, filtering, and export for tabular data and logs.
- **Code Formatter**: Standardize code structure instantly.

### 📚 Wiki & Knowledge Base
- **Markdown Documentation**: Collaborative rich-text editor for specifications, runbooks, and onboardings.
- **Public & Shared Views**: Share specific guides with external stakeholders safely.

### 🛡️ Access Control & Administration
- **Role-Based Permissions (RBAC)**: Distinct permissions for `Member`, `Moderator`, and `Owner`.
- **User Management**: Moderation tools, access provisioning, and real-time session tracking.
- **Enterprise Security**: Row-Level Security (RLS) policies implemented via PostgreSQL & Supabase.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (shadcn/ui) + [Lucide Icons](https://lucide.dev/) |
| **Backend & DB** | [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row-Level Security, Edge Functions) |
| **Data Fetching** | [TanStack React Query](https://tanstack.com/query) |
| **Visualizations** | [Recharts](https://recharts.org/) |
| **Content & Editors** | `@uiw/react-md-editor`, `react-markdown`, `react-syntax-highlighter`, `diff` |
| **Data Processing** | `papaparse`, `xlsx`, `jspdf`, `html2canvas` |

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- Package manager: `pnpm` (recommended), `npm`, or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd wasp
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Start the Development Server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

| Command | Action |
|---|---|
| `pnpm dev` | Starts the Vite local development server |
| `pnpm build` | Compiles and builds production-ready bundle into `dist` |
| `pnpm build:dev` | Compiles and builds bundle in development mode |
| `pnpm preview` | Serves the production build locally for verification |
| `pnpm lint` | Runs ESLint to validate code quality and syntax |

---

## 🔒 Security & Environment Variables

> [!IMPORTANT]
> Never commit actual `.env` files containing secrets or production API keys to git. 
> 
> The `.gitignore` is configured to ignore all `.env` and `.env.*` files (except `.env.example`). When deploying or onboarding team members, supply variables through your deployment platform (e.g. Vercel, Supabase, Cloudflare) or through `.env.example` templates.

---

## 📄 License

This project is proprietary and intended for internal team operations and authorized contributors.
