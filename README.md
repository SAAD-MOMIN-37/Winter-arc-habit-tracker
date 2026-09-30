# ARC — Habit Tracker PWA

A mobile-first Progressive Web App with a minimal black glassmorphism UI.

## Features
- Namaaz: Fajr, Dhuhr, Asr, Maghrib, Isha
- Workout, steps, water, food, learning, productivity
- Sleep tracking
- Day / Week / Month analytics
- Goals, history calendar and monthly reflection
- LocalStorage persistence
- Installable PWA with service worker
- Export / reset local data

## Run locally
Use any static server (required for the service worker), for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

For phone installation, deploy the folder to a static HTTPS host and open it on Android Chrome, then choose **Add to Home screen / Install app**.
