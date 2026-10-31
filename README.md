# Masagana 2nd Ward Calling Approvals

Calling approvals and vacancy management for Masagana 2nd Ward, with 3-point bishopric sign-off.

- **Frontend:** Astro page that mounts the React app (`src/App.tsx`) with `client:only`, styled with Tailwind.
- **Backend:** one Cloudflare Worker (`worker/`) serving the built site and `/api/*`.
- **Data + live updates:** a single Durable Object (`CouncilRoom`) stores every document (callings,
  proposals, council messages, system metadata) in its SQLite storage and pushes each change to every
  open device over a WebSocket (`/api/live`).

```
device ──ws /api/live──▶ Worker ──▶ CouncilRoom (Durable Object)
device ──POST /api/write──▶ Worker ──▶ CouncilRoom.write() ──broadcast──▶ every open device
```

The data model is the one the app had on Firestore: collections of JSON documents keyed by id, and
saves merge the way Firestore's `setDoc(..., { merge: true })` did (`src/lib/syncProtocol.ts`).
`src/services/dataService.ts` keeps the functions the app always called; `src/services/liveStore.ts`
is the browser copy of the data and the WebSocket connection.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run preview          # build + wrangler dev: the whole app with the API at http://localhost:8787
```

`npm run dev` gives Astro hot reload on port 3000 and forwards `/api` to `wrangler dev`, so run
`npm run dev:worker` alongside it. Local data lives in `.wrangler/state` and never touches production.
`npm run lint` type-checks the app and the Worker.

## Deploying

```bash
npx wrangler login
npm run deploy
```

## Moving the data over from Firestore (one time)

```bash
npm run export-firestore                      # writes migration/firestore-export.json (gitignored)
npx wrangler secret put IMPORT_TOKEN          # any long random string
IMPORT_TOKEN=... npm run import-data -- https://<worker address>
npx wrangler secret delete IMPORT_TOKEN       # turns the import endpoint off again
```

The import replaces everything in the Durable Object with the export, then reads it all back and
checks every document is identical (`--verify-only` runs just the check). Export and import right
before switching the leaders over: anything saved in the old AI Studio app afterwards isn't copied.
