# Implementation Plan - "Ethereal Luxury" Redesign

## Goal
Completely overhaul the UI to a high-end, creative, and immersive experience. Fix alignment issues by moving to full-width layouts.

## User Review Required
> [!IMPORTANT]
> This is a radical departure from the current design. It will use full-screen sections, split layouts, and a "Typeform-style" creation flow.

## Proposed Changes

### 1. Global Styles & Fonts
- **Font**: Import `Playfair Display` (Serif) and `Montserrat` (Sans) from Google Fonts in `layout.tsx`.
- **Theme**: Deepest Black (`#000000`) with Gold gradients.

### 2. Layout Structure (`page.tsx`)
- **Remove**: `container mx-auto` (fixes the padding issue).
- **New Structure**:
    - **Hero Section**: Full viewport height (`h-screen`). Large, centered typography. "Begin Journey" CTA.
    - **Creation Mode**: A focused, minimal input overlay.
    - **Result Mode**: Full-screen split layout.

### 3. Component Redesign

#### [NEW] `CreationWizard.tsx` (Replaces `GenerateForm`)
- **Style**: Minimalist, centered input. Large text.
- **Animation**: Smooth fade-ins.

#### [MODIFY] `FinalDisplay.tsx`
- **Layout**: Split Screen (50/50 on Desktop).
    - **Left**: Large Image / AR View (Sticky).
    - **Right**: Details, Sketches, Controls (Scrollable).
- **AR**: "Maximize" button expands Left side to 100% width.

#### [MODIFY] `GalleryView.tsx`
- **Layout**: Horizontal scrolling strip with snap points.

## Verification Plan
1. **Alignment**: Verify no unwanted padding on the right.
2. **Responsiveness**: Check Split Screen behavior on mobile (stack vertically).
3. **Aesthetics**: Confirm the "Luxury" feel.
