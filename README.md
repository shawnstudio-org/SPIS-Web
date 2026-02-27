# SPIS Web

Next.js frontend for SPIS (Selective Performance Intelligence System).

## Local Development

1. Set API base URL:

```bash
cp .env.example .env.local
```

2. Start the app:

```bash
npm run dev
```

3. Open:

- `http://localhost:3000/login`

## Required API

This UI expects the SPIS Worker API with routes under:

- `NEXT_PUBLIC_API_BASE_URL` (for example `https://spis-api.shawnzhao0518.workers.dev`)

## Build Checks

```bash
npm run lint
npm run build
```

## Implemented Pages

- `/login`, `/register`
- `/dashboard`
- `/students`
- `/students/[id]/reports/new`
- `/students/[id]/reports`
- `/students/[id]/diagnosis`
- `/students/[id]/prescriptions`
- `/students/[id]/progress`
- `/students/[id]/strategy`
- `/settings/plan`
