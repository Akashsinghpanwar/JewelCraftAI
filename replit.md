# AI Jewelry Generator

## Overview
An AI-powered jewelry design webapp that generates multi-angle views of jewelry from text prompts, allows customization, and creates sketch and 3D model representations.

## Recent Changes
- **October 29, 2025**: Initial project setup
  - Created FastAPI backend and Next.js frontend structure
  - Configured OpenAI integration for multi-angle image generation
  - Implemented modification controls for metal type, gemstone, and band shape
  - Added 3-panel final display with carousel, sketch, and 3D viewer

## Architecture

### Frontend (Next.js + TailwindCSS)
- Location: `/frontend`
- Framework: Next.js 14+ with React 18+
- Styling: TailwindCSS with elegant white/gold gradient theme
- 3D Viewer: React-Three-Fiber for interactive model rotation
- Features:
  - Multi-angle gallery with camera perspective labels
  - Modification controls (metal, gemstone, band shape)
  - 3-panel final layout: carousel, sketch, 3D viewer
  - Smooth transitions and rounded card design

### Backend (FastAPI)
- Location: `/backend`
- Framework: FastAPI with Python 3.11
- Endpoints:
  - `POST /generate`: Creates 4-5 views of jewelry from different angles
  - `POST /modify`: Regenerates views with updated material/design parameters
  - `POST /finalize`: Generates sketch and 3D model from final design
- Storage: In-memory session management (no database)

### AI Integration
- OpenAI DALL-E: Multi-angle jewelry rendering
- ControlNet/Edge Detection: Sketch/blueprint generation
- Camera angles: front, side, top, angled, perspective

## User Preferences
- Clean, elegant jewelry-brand aesthetic
- White/gold gradient color scheme
- Smooth animations and rounded cards
- No database - all data in memory

## Project Structure
```
/
├── backend/
│   ├── main.py (FastAPI app)
│   ├── requirements.txt
│   └── utils/ (image processing, AI generation)
├── frontend/
│   ├── src/
│   │   ├── app/ (Next.js pages)
│   │   ├── components/ (UI components)
│   │   └── utils/ (API client)
│   ├── package.json
│   └── tailwind.config.js
└── replit.md (this file)
```

## Environment Variables
- `OPENROUTER_API_KEY` or `OPENAI_API_KEY`: Required for AI image generation
  - The app supports both OpenRouter (unified API for multiple models) and direct OpenAI
  - OpenRouter is recommended as it provides access to multiple image models
- `SESSION_SECRET`: For session management

## Development
- Frontend runs on port 3000
- Backend runs on port 8000
- Main workflow serves frontend (proxies to backend)
