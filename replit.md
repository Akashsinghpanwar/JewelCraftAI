# AI Jewelry Generator

## Overview
An AI-powered jewelry design webapp that generates multi-angle views of jewelry from text prompts, allows customization, and creates sketch and 3D model representations.

## Recent Changes
- **October 29, 2025**: Enhanced sketch generation with multi-view AI rendering
  - Implemented multi-view technical sketch generation (left, right, top views)
  - Upgraded from basic edge detection to AI-powered professional blueprint sketches
  - Added sketch gallery with thumbnail navigation and angle labels
  - Sketches now use detailed technical drawing prompts for CAD-style illustrations
  - Backend returns `sketches` array instead of single `sketch` (backwards compatible)
- **October 29, 2025**: Bug fixes and configuration updates
  - Fixed ARK_API_KEY configuration for Seedream 4.0 image generation API
  - Fixed Next.js cross-origin warnings by configuring allowedDevOrigins with REPLIT_DEV_DOMAIN
  - Removed unused OpenAI dependency from requirements.txt
  - Updated Next.js config to properly handle Replit's dynamic domains
- **October 29, 2025**: Initial project setup
  - Created FastAPI backend and Next.js frontend structure
  - Configured BytePlus ARK (Seedream 4.0) integration for multi-angle image generation
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
  - 3-panel final layout: renders carousel, technical sketches gallery, 3D viewer
  - Multiple sketch views (left, right, top) with thumbnail navigation
  - Smooth transitions and rounded card design

### Backend (FastAPI)
- Location: `/backend`
- Framework: FastAPI with Python 3.11
- Endpoints:
  - `POST /generate`: Creates 4-5 views of jewelry from different angles
  - `POST /modify`: Regenerates views with updated material/design parameters
  - `POST /finalize`: Generates multi-view technical sketches (left, right, top) and 3D model
- Storage: In-memory session management (no database)

### AI Integration
- BytePlus ARK (Seedream 4.0): Multi-angle jewelry rendering and technical sketches
- Sketch Generation: AI-powered professional technical drawings with CAD-style line art
- 3D Model Creation: Photorealistic renders with PBR materials and ray-traced lighting
- Camera angles for renders: front, side, top, 45-degree angled, perspective
- Sketch views: left, right, top (professional blueprint style)

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
- `ARK_API_KEY`: Required for BytePlus ARK (Seedream 4.0) AI image generation
  - Used to generate realistic jewelry images from text prompts
  - Securely stored in Replit Secrets
- `REPLIT_DEV_DOMAIN`: Automatically provided by Replit for cross-origin configuration

## Development
- Frontend runs on port 5000 (Next.js with Turbopack)
- Backend runs on port 8000 (FastAPI with Uvicorn)
- Frontend proxies API requests to backend via `/api` route
- Next.js configured for Replit environment with dynamic origin handling
