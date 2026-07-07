# Daily Status Reporting System (WASP) - Documentation

## Overview
The Daily Status Reporting System is a comprehensive module within the WASP platform designed to streamline daily progress tracking for the SE MAPPERS team. It automates the collection, calculation, and reporting of task statuses, reducing manual effort and ensuring data consistency.

---

## 🚀 Key Features

### 1. Daily Status Submission
- **Dynamic Input**: Users can submit multiple links for "New Development" and "Updates".
- **Smart Validation**: The system automatically distinguishes between valid task links and administrative entries like "NA" or "On Leave".
- **Persistent Storage**: Data is stored securely in Supabase with full history tracking.

### 2. Automated Email Reporting (One-Click)
- **Email Generation**: Automatically prepares an email via the `mailto:` protocol.
- **Pre-filled Metadata**:
    - **Recipient**: pankaj.patil@bristlecone.com
    - **CC**: Default team distribution list.
    - **Subject**: Dynamic date-based subject (e.g., *Status - Monday, December 22nd, 2025*).
    - **Body**: Includes a greeting, a link to the live report, and a sign-off.
- **Reference Attachments**: Automatically triggers a PNG download of the current status report for easy attachment.

### 3. Advanced Export & Sharing
- **PDF Export**: Generates a professional, branded PDF report.
- **PNG Snapshot**: High-resolution image capture for quick sharing on Slack/Teams.
- **Excel Export**: Structured data export with clickable hyperlinks.
- **Shareable Links**: One-click to copy direct URLs to specific daily reports.

### 4. Team Velocity Analytics
- **Live Charts**: Visual representation of "New Dev" vs "Updates" vs "Total" for the selected day.
- **Monthly Insights**: Calendar heat-map showing team activity levels throughout the month.
- **Filtering**: Real-time exclusion of "NA/Leave" from statistical charts to maintain data integrity.

### 5. Management & Roles
- **Moderator/Owner Controls**:
    - Manage statuses for other team members.
    - Delete incorrect or duplicate entries via the administrative table.
    - Access to advanced reporting and export tools.
- **Member Access**: Restricted to viewing reports and submitting their own daily status.

---

## 🛠 Technical Architecture

- **Frontend**: React (TSX) + Tailwind CSS (Vite)
- **State Management**: TanStack Query (React Query) for real-time synchronization.
- **Backend**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **Libraries**:
    - `html2canvas` & `jsPDF` for PDF/Image generation.
    - `xlsx` for Excel processing.
    - `date-fns` for robust date formatting.

---

## 🛠 Administrator Guide: Deleting Entries
Owners and Moderators can now manage the team board directly:
1. Navigate to the **Daily Status** page.
2. Scroll to the **Team Table**.
3. Use the **Trash Icon** next to any entry to remove it. A refresh is triggered automatically to update the Velocity Charts.

---

## 📈 Impact
- **Time Saved**: Automates the manual task of compiling links and calculating totals for daily emails.
- **Visibility**: Provides leadership with a "single source of truth" for team productivity.
- **Professionalism**: Ensures standard formatting for all outgoing reports.
