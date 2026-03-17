# Shree Ganesh Kulfi Sales App - Changes and Records

## Project Summary
This website is a React + Vite sales analytics web app for Shree Ganesh Kulfi.

Core modules implemented:
- Dashboard analytics with charts and KPIs
- Add Sale workflow (single and multi-item cart)
- Records table with filters, pagination, delete, and export
- Flavor Analysis charts and leaderboard
- Cloud data sync with Supabase (with local fallback)
- GitHub Pages deployment pipeline

## Major Change Log (from git history)

### 983396a - Initial commit: Kulfi sales web app
- Base project and app structure created.

### c23a1f0 - Setup GitHub Pages deployment workflow
- Added GitHub Actions workflow for static deployment.

### 62e676e - Fix GitHub Pages workflow enablement and Node24 runtime
- Updated Pages action setup and runtime compatibility.

### 0964556 - Fix Pages deploy action version and job env
- Corrected action versions and environment behavior.

### fe9a602 - Add Supabase database integration with GitHub Pages env setup
- Added Supabase client integration in app context.
- Added SQL schema and policies file.
- Added environment template and deploy env wiring.

### e184862 - Allow Supabase env from GitHub secrets or variables
- Made deploy workflow accept both GitHub Secrets and Variables.

### 9d54b60 - Make Add Sale popup fully opaque
- Reduced transparency issues in selection modal.

### 4930728 - Improve mobile alignment and add realtime cross-device sync
- Added Supabase realtime subscription for cross-device updates.
- Improved mobile UI alignment.

### 8b31c27 - Fix major mobile alignment issues across Add Sale UX
- Mobile spacing, stacking, tap targets, and responsive behavior improved.

### 948689e - Remove default quantity 1 - field starts empty on flavor select
- Quantity field now requires user entry instead of prefilled value.

### dcb9f0e - Fix cart save error: fall back to localStorage if Supabase insert fails
- Added resilience: sales are not lost if cloud insert fails.

### 81748a9 - Keep two kulfi cards per row on all mobile widths
- Mobile grid forced to show two items per row.

### e621689 - Reorder Add Sale sections: cart on top and sales details at bottom
- Cart moved to top, sales detail form moved to end of page.

## Functional Records

### Add Sale Flow
- Flavor selection popup with quantity controls
- Add to Cart and Add to Sale actions
- Multi-item cart checkout with total amount
- Toast feedback for success/failure

### Records Page
- Filter by flavor and date range
- Paginated table (20 rows per page)
- Delete sales row action
- Export filtered report as CSV (Excel compatible)

### Dashboard and Analytics
- Total revenue, units, average order value, top flavor
- Monthly revenue bar chart
- Top flavors chart
- 30-day daily sales trend chart
- Flavor analysis charts and leaderboard

### Data Persistence
- Primary: Supabase table public.sales
- Realtime updates enabled across devices
- Local fallback storage for offline/error safety

## Current Product Catalog Notes
- Includes custom flavors and pricing updates
- Added Small Rabdi Kulfi at Rs 15
- Added Pista and Butterscotch with uploaded custom images

## Deployment Records
- Repository: https://github.com/AdiTilekar/Sales-web-application
- Live URL: https://aditilekar.github.io/Sales-web-application/
- Deploy method: GitHub Pages via Actions workflow

## Key Files
- App routing and layout: src/App.jsx
- Global styles: src/index.css
- Add Sale page: src/pages/AddSale.jsx
- Records page: src/pages/Records.jsx
- Dashboard page: src/pages/Dashboard.jsx
- Sales context and data sync: src/context/SalesContext.jsx
- Product data: src/data/products.js
- Supabase schema: supabase-schema.sql
- Deployment workflow: .github/workflows/deploy.yml
