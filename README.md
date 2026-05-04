# [ranzaGG](https://gg.ranzak.dev)

> A free, ad-free, open-source GeoGuessr alternative powered by Mapillary street-level imagery.

---

## Overview

**ranzaGG** is a geographical guessing game where players are dropped into random street-level panoramas from around the world and must guess their location on a map. The closer the guess, the more points are earned.

The project is built on top of [Mapillary](https://www.mapillary.com/) community-contributed imagery and is entirely free to play — no ads, no subscriptions, no paywalls.

> ⚠️ **This project is archived and no longer actively maintained.** It is published for reference and portfolio purposes.

---

## Features

- 🌍 **Singleplayer & Multiplayer** — play alone or create/join a real-time lobby with friends
- 🎮 **3 Game Modes** — Time Limit, Distance Limit, and Elimination
- 🗺️ **Geo Filtering** — filter locations by continent, country, or city
- 🔭 **360° Panoramas** — full panoramic images are served in-game (not all images are 360°)
- 🌙 **Dark Theme** — fully dark UI with customizable map styles (Dark Matter, Voyager, OSM)
- 🌐 **Multilingual** — full English and Hungarian (Magyar) support via vue-i18n
- 📱 **Responsive** — works on desktop, tablet, and mobile

---

## Tech Stack

| Layer     | Technology                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| Framework | [Nuxt 3](https://nuxt.com/) (Vue 3, SSR)                                      |
| Real-time | [Socket.IO](https://socket.io/)                                               |
| Panoramas | [Mapillary JS](https://www.mapillary.com/developer/mapillary-js)              |
| Guess Map | [Leaflet.js](https://leafletjs.com/)                                          |
| Database  | [MongoDB](https://www.mongodb.com/) + Mongoose                                |
| State     | [Pinia](https://pinia.vuejs.org/)                                             |
| i18n      | [@nuxtjs/i18n](https://i18n.nuxtjs.org/)                                      |
| Icons     | [Phosphor Icons](https://phosphoricons.com/) via Nuxt Icon                    |
| Map Tiles | [CARTO](https://carto.com/) / [OpenStreetMap](https://www.openstreetmap.org/) |
| Geocoding | [Nominatim](https://nominatim.org/)                                           |
| CSS       | SCSS (scoped per component)                                                   |

---

## Project Structure

```
.
├── app/
│   ├── components/          # Reusable Vue components
│   │   ├── features/        # Feature components (GameSettings, GameMap, etc.)
│   │   └── global/          # Global components (SettingsModal, Toast, etc.)
│   ├── composables/         # Vue composables (useMapStyle, useToast, etc.)
│   ├── locales/             # i18n translation files
│   │   └── features/
│   │       ├── game/        # en.json / hu.json
│   │       ├── error/       # en.json / hu.json
│   │       ├── bbox/        # en.json / hu.json
│   │       └── pages/       # en.json / hu.json
│   ├── pages/               # Nuxt pages (index, tutorial, terms, about, admin/bbox)
│   └── stores/              # Pinia stores (geo, settings)
├── server/
│   ├── api/                 # Nuxt server API routes
│   │   └── game/            # batch-locations, regions endpoints
│   ├── models/              # Mongoose models (Location)
│   ├── plugins/             # Nuxt server plugins (MongoDB connection)
│   ├── scripts/             # CLI scripts
│   │   ├── explore.ts       # Map mining engine
│   │   └── migrate-panorama.ts  # One-time DB migration
│   └── utils/               # Utilities (discord logging, etc.)
├── public/                  # Static assets
├── nuxt.config.ts           # Nuxt + i18n configuration
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
MONGODB_URI=mongodb+srv://...
MAPILLARY_CLIENT_TOKEN=your_mapillary_token
NUXT_PUBLIC_MAPILLARY_CLIENT_TOKEN=your_mapillary_token
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...  # optional
```

> Get a Mapillary token at [mapillary.com/developer](https://www.mapillary.com/developer/api-documentation).

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- A MongoDB database (Atlas free tier works fine)
- A Mapillary access token

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
pnpm build
pnpm preview
```

---

## Map Mining Script

The `server/scripts/explore.ts` script collects street-level image coordinates from the Mapillary Vector Tile API and stores them in MongoDB.

```bash
pnpm explore
```

### Modes

| Mode             | Zoom | Description                                        |
| ---------------- | ---- | -------------------------------------------------- |
| **Global (1)**   | Z=5  | World-wide scan for representative panoramas       |
| **Targeted (2)** | Z=14 | Full extraction of all images within a custom BBOX |

### Features

- Systematic grid-based tile scanning — every tile is visited exactly once
- Progress is saved per BBOX (unique hash) — safe to interrupt and resume
- `isPanorama: true` flag is stored for 360° images; flat images are also saved but not served in-game
- 50m minimum distance filter between saved locations to avoid clustering
- Nominatim reverse geocoding for country/city metadata
- Rate limit detection and automatic backoff

### Available Scripts

```bash
pnpm explore            # Run the map mining engine
```

---

## Admin Tools

A BBOX (Bounding Box) generator is available at `/admin/bbox` (no auth required in current build). It provides an interactive Leaflet map to draw and copy BBOX coordinates for use with the mining script.

---

## Multilingual Support

All UI text is managed via `@nuxtjs/i18n`. Translation files live in `app/locales/features/<feature>/`:

- `en.json` — English
- `hu.json` — Magyar (Hungarian)

To add a new language, add locale files and register them in `nuxt.config.ts`.

---

## Attribution

- Street-level imagery © [Mapillary / Meta](https://www.mapillary.com/)
- Map tiles © [CARTO](https://carto.com/) and [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Geocoding © [Nominatim / OpenStreetMap](https://nominatim.org/)
- Icons © [Phosphor Icons](https://phosphoricons.com/)

---

## License

This project is published as-is for reference purposes. No active maintenance is planned.
