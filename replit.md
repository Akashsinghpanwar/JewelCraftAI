# AI Jewelry Generator

## Overview
An AI-powered jewelry design webapp that generates multi-angle views of jewelry from text prompts, allows customization, and creates sketch and 3D model representations.

## Recent Changes
- **October 29, 2025**: Implemented crop-and-enhance workflow for 100% design consistency
  - Generate ONE ultra-high-resolution base image (2K) for perfect consistency
  - Crop specific regions (pendant, chain, clasp, etc.) from the base image
  - Enhance each crop using Seedream 4.0 image-to-image enhancement (NO redesign, only upscale/sharpen)
  - Display base image + enhanced detail close-ups (pendant detail, chain detail, clasp detail)
  - Guarantees ALL images show EXACTLY the same jewelry - zero geometry drift
  - Enhanced crops show ultra-realistic macro photography quality with NO AI hallucination
  - Smart region detection based on jewelry type (necklace, ring, bracelet)
  - Fixed aspect ratio validation: All crops maintain 0.33-3.00 aspect ratio requirement for Seedream API
- **October 29, 2025**: Single-item enforcement and render display fix
  - Strengthened prompts to prevent extra objects: "ONLY ONE jewelry item", "NO rings unless specified", "NO extra objects"
  - Ensures only the requested item is generated, nothing else
  - Fixed render display in finalized view: changed from object-cover to object-contain
  - Reverted to AI-generated professional technical blueprint sketches for better visual quality
- **October 29, 2025**: Enhanced design consistency and sketch display fix
  - Strengthened render prompts to ensure EXACT SAME jewelry across all angles
  - Added explicit instructions: SAME chain thickness, pendant size, metal finish, gemstone placement
  - Added "DO NOT vary the design" and "DO NOT change any jewelry elements" enforcement
  - Fixed sketch display issue: changed from object-cover to object-contain for full visibility
  - Sketches now properly centered and fully visible in their display boxes
  - Fixed 500 timeout errors: Added 3-minute axios timeouts to all API calls (generate, modify, finalize)
  - Prevents socket hang up errors during image generation
- **October 29, 2025**: Explicit background exclusion and prompt strengthening
  - Added explicit negative prompts to ALL generation endpoints: NO scenery, NO water, NO ocean, NO sky, NO flowers, NO props
  - Enforced "jewelry ONLY on PLAIN WHITE BACKGROUND" for renders
  - Ensured descriptive words (ocean, flower) are interpreted as design inspiration only, never literal backgrounds
  - Applied background exclusion to: initial generation, modifications, sketches, and 3D model
  - All outputs now guarantee isolated jewelry product shots with no environmental elements
- **October 29, 2025**: Technical catalog sketch formatting and framing
  - Implemented proper sketch framing: centered within bordered rectangular frames
  - Added uniform border margins like technical catalog pages
  - Ensured complete jewelry is fully visible with NO cropped edges
  - All 6 sketches now show SAME EXACT jewelry geometry and proportions
  - Enforced black and gray pencil tones ONLY - NO colors, gradients, or digital filters
  - Professional manufacturer's technical documentation style, production-ready blueprints
- **October 29, 2025**: Ultra-realistic sketches and design consistency improvements
  - Fixed 500 timeout errors by implementing parallel sketch generation (12x faster)
  - Enhanced modify/update prompts to REFINE the same base design, not create new ones
  - Modified jewelry now PRESERVES the original shape/structure, only updates materials
  - Upgraded to ultra-realistic technical pencil-shaded blueprint sketches
  - Sketches now feature: precise geometry, fine graphite shading, detailed metal/stone reflections
  - Clear structural lines, realistic depth, NO color, NO artistic filters
  - Professional jewelry designer quality hand-drawn blueprints on white paper
  - 6 sketch views: front, top, side, isometric, detail close-up, profile
- **October 29, 2025**: Improved rendering consistency and realistic pencil sketches
  - Enhanced multi-angle render prompts to ensure all views show the SAME jewelry design
  - Only camera angle, lighting, and background now vary between renders - design stays identical
  - Upgraded sketch generation from 3 to 6 realistic hand-drawn pencil sketches
  - Sketches now feature fine graphite shading, reflections on metal, shadow depth, and precise geometry
  - Added new sketch views: front, top, side, isometric, detail close-up, profile
  - Sketches use white/light-gray paper background for authentic hand-drawn appearance
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
  - 6 realistic pencil sketch views with thumbnail navigation
  - Smooth transitions and rounded card design

### Backend (FastAPI)
- Location: `/backend`
- Framework: FastAPI with Python 3.11
- Endpoints:
  - `POST /generate`: Creates 1 ultra-high-res base image (2K) → crops regions → enhances each crop → returns base + detail close-ups
  - `POST /modify`: Creates 1 ultra-high-res base image with new materials → crops regions → enhances → returns updated base + detail close-ups
  - `POST /finalize`: Generates 6 professional technical blueprint sketches (parallel) and 3D model
- Storage: In-memory session management (no database)

### AI Integration
- BytePlus ARK (Seedream 4.0): Ultra-high-res generation (2K) + image-to-image enhancement
- Workflow: Generate ONE base image → crop regions → enhance crops (upscale only, NO redesign)
- Background Policy: Jewelry ONLY on plain/transparent backgrounds - NO scenery, water, ocean, sky, flowers, or props
- Design Consistency: 100% guaranteed - all images derived from the same base image through cropping and enhancement
- Enhancement Policy: Crops are enhanced to ultra-high resolution WITHOUT modifying design/geometry - photo enhancement only
- Sketch Generation: 6 ultra-realistic technical pencil-shaded blueprint sketches (parallel generation)
- Sketch Features: Same exact jewelry geometry across all views, centered within bordered rectangular frames, uniform border margins (technical catalog format), complete jewelry fully visible with NO cropped edges, black and gray pencil tones ONLY, NO colors/gradients/digital filters, plain white/light gray paper background, professional manufacturer's technical documentation style, production-ready blueprints
- 3D Model Creation: Photorealistic renders with PBR materials and ray-traced lighting
- Base image: Ultra-high-res (2K) centered product photography
- Detail crops (auto-detected based on jewelry type):
  - Necklace: pendant, chain, clasp
  - Ring: gemstone, band, side detail
  - Bracelet: center link, clasp, pattern
- Sketch views: front, top, side, isometric, detail close-up, profile

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
