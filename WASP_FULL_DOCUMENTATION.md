# WASP (Workflow Automation & Sanctuary Platform) - Documentation

## Project Vision
WASP is a unified digital ecosystem built specifically for the SE MAPPERS team. It serves as a central hub to manage code assets, automate repetitive manual tasks, track team performance, and maintain a shared knowledge base (Wiki). By consolidating multiple tools into a single platform, WASP removes friction from daily operations and enhances team collaboration.

---

## 🛠 Core Modules & Features

### 1. Code Library (Snippet Sanctuary)
- **Central Repository**: A searchable database of reusable code snippets, utility functions, and complex logic blocks.
- **Categorization**: Multi-tagging system for quick discovery (e.g., Logic, UI, Database).
- **Easy Access**: Features one-click copying and direct sharing of snippet URLs.
- **Collaborative**: Team members can contribute new snippets or update existing ones.

### 2. Developer Productivity Tools
A suite of built-in utilities designed to replace ad-hoc third-party websites:
- **Diff Checker**: High-performance comparison tool for identifying changes between two code blocks or text files.
- **Code Formatter**: Standardizes code structure for better readability and maintainability.
- **CSV Visualizer**: Transforms raw CSV data into a clean, searchable table format for quick analysis of map data or logs.

### 3. Daily Status & Reporting System
- **Automated Logging**: Streamlined interface for team members to submit their daily tasks (New Dev & Updates).
- **Case Counting**: Intelligent logic that filters out non-task entries (like "On Leave" or "NA") to provide accurate productivity metrics.
- **One-Click Email Integration**: Automatically generates structured status emails to leadership (Pankaj & Team distribution) with pre-filled subjects and bodies.
- **Visual Analytics**: Live velocity charts and monthly performance heatmaps.

### 4. SE MAPPERS Map Central
- **Maps Explorer**: A specialized module for managing and viewing map configurations.
- **Map Generator**: Tools designed to assist in the creation of new map templates.
- **Visualization**: Enhanced UI for viewing complex mapping structures.

### 5. Wiki & Documentation
- **Collective Knowledge**: A collaborative documentation center for storing process guides, project specs, and best practices.
- **Markdown Support**: Rich text documentation for clear and detailed guides.
- **External Sharing**: Dedicated public-facing views for shared wiki pages.

### 6. Leaderboard & Gamification
- **Team Spirits**: A dashboard displaying team statistics and performance rankings.
- **Engagement Tracking**: Encourages productivity by visualizing individual and collective milestones.

### 7. User & Access Management
- **Role-Based Security**: Three defined roles—**Member**, **Moderator**, and **Owner**.
- **Admin Controls**: Moderators and Owners can manage users, update roles, and clean up historical data.
- **Session Management**: Secure authentication via Supabase Auth with real-time online status tracking.

---

## ⚙️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS for high-performance, premium aesthetics.
- **Database & Backend**: Supabase (PostgreSQL) for real-time data and storage.
- **ORM & Data Fetching**: TanStack Query (React Query) for state synchronization and caching.
- **Infrastructure**: Row Level Security (RLS) for enterprise-grade data protection.

---

## 🚀 Impact & ROI
- **Efficiency**: Reduces time spent on manual reporting by ~85%.
- **Knowledge Sharing**: Prevents "knowledge silos" by centralizing code and process information.
- **Data Integrity**: Automated calculations ensure reporting is always objective and accurate.
- **Cost Saving**: Removes dependence on multiple disparate tools by providing a holistic, custom-built solution.
