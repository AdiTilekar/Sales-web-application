# Shree Ganesh Kulfi Sales App

Sales analytics and entry app built with React + Vite.

## 1. Install and run

```bash
npm install
npm run dev
```

## 2. Supabase database setup (shared data across phones)

1. Create a Supabase project.
2. Open SQL Editor and run the script in [supabase-schema.sql](supabase-schema.sql).
3. In Project Settings -> API, copy:
   - Project URL
   - Anon public key
4. Create a `.env` file based on [.env.example](.env.example):

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Restart dev server.

If Supabase env vars are missing, the app falls back to browser localStorage.

## 3. Deploy on GitHub Pages

The repository includes Pages workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

1. Push to `main`.
2. In GitHub -> Settings -> Pages, ensure source is GitHub Actions.
3. Add repository variables/secrets for build-time env values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Without these env values, deployed site will run in localStorage fallback mode.

## 4. Build and lint

```bash
npm run build
npm run lint
```
