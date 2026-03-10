# Log Insight Viewer - PRD

## Original Problem Statement
Build a Log Analysis Dashboard that takes an Excel file with 3 columns (log type, log stamp, log summary). It plots log type errors with timestamps and generates AI-powered summaries of errors.

## User Choices
- Both chart types (line chart for trends, bar chart for counts)
- AI-powered intelligent summary using GPT-5.2 via Emergent LLM key
- Dark theme with light/dark theme toggle
- Export summary as PDF/text
- Demo data for testing

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn UI, Recharts
- **Backend**: FastAPI with MongoDB
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM key

## What's Been Implemented (Jan 2026)
- [x] Excel file upload with drag & drop
- [x] Demo data button for testing (20 sample logs)
- [x] Line chart (error trends over time)
- [x] Bar chart (error counts by type)
- [x] AI-powered summary generation using GPT-5.2
- [x] Dark/Light theme toggle
- [x] Export summary as Text file
- [x] Export summary as PDF
- [x] Stats cards (Total, Errors, Warnings, Info counts)
- [x] Terminal-style log viewer with color-coded entries
- [x] Responsive "Performance Pro" design

## Core Requirements
- Excel columns: log_type, log_stamp, log_summary
- Supported log types: ERROR, WARNING, INFO
- MongoDB storage for uploaded log data
- Real-time chart updates on data load

## Prioritized Backlog
### P0 (Done)
- All core features implemented

### P1 (Future Enhancements)
- Date range filtering
- Log type filtering
- Search within logs
- Multiple file comparison

### P2 (Nice to Have)
- Real-time log streaming
- Alert thresholds configuration
- Integration with log aggregators (ELK, Splunk)
