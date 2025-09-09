## Problem: Link generation and real‑time collaboration not working

This issue documents a deep-dive analysis into problems around generating share links and real-time collaboration. It summarizes the current architecture, observed pitfalls, and concrete, code-free remediation steps.

---

**Symptoms (reported)**
- Link generation: “doesn’t work” (unclear which links, assumed collaboration/permalinks).
- Real-time collaboration: clients don’t sync or join properly.

---

**Architecture Overview (current)**
- Client app: `excalidraw/excalidraw-app` (Vite React app).
- Real-time server(s):
  - TypeScript server with Socket.IO and REST: `excalidraw-room/src/index.ts`.
  - A second JS Socket.IO server: `excalidraw/excalidraw-room/src/index.js`.
- “Backned” REST API (SQLite): `Backned/src/server.ts`, `Backned/src/routes.ts`.
- Env/config:
  - Client WS URL: `VITE_APP_WS_SERVER_URL` (e.g., `http://localhost:3002`).
  - Client REST URL: `VITE_APP_BACKEND_URL` (e.g., `http://localhost:3005`).
  - Vite dev server port: `VITE_APP_PORT=3000`.
  - CORS origins on servers are set to `http://localhost:3000` in local `.env`s.

---

**Key Findings**

1) Two different collaboration servers exist with incompatible event names
- Client uses events defined in `excalidraw/excalidraw-app/app_constants.ts`:
  - `WS_EVENTS.SERVER` = `"server-broadcast"`
  - `client-broadcast` is expected from server.
- TypeScript server (`excalidraw-room/src/index.ts`) matches these events:
  - Listens on `server-broadcast` / emits `client-broadcast`.
- JS server (`excalidraw/excalidraw-room/src/index.js`) uses different names:
  - Listens on `server` / emits `client`, and `server-volatile` / `client-volatile`.
- If the app points to the JS server, collaboration will fail silently because event names don’t match.

2) Persistent rooms: browser code attempts to talk to PostgreSQL directly
- Client code for persistence is in `excalidraw/excalidraw-app/data/postgresql.ts`.
- It tries to import `pg` and create a `Pool` (Node-only). In the browser it returns `null`:
  - See `getPool()` returning `null` in browser.
  - Vite config explicitly excludes `pg` from deps: `vite.config.mts` has `optimizeDeps.exclude: ['pg']`.
- As a result, calls to `saveToPostgreSQL()` / `loadFromPostgreSQL()` from `Collab.tsx` do nothing in the browser:
  - Rooms aren’t persisted or loaded when `VITE_APP_PERSISTENT_ROOMS=true`.
  - New collaborators may see blank scenes on join, and “persistent” rooms don’t actually persist.
- The app does have a proper REST client (`excalidraw/excalidraw-app/data/api-client.ts`) pointing at `VITE_APP_BACKEND_URL` with endpoints `/api/scenes/:roomId` etc., but it isn’t used by the collaboration save/load path.

3) Backends are duplicated and inconsistent
- “Backned” (SQLite) provides `/api/scenes` and `/api/permalinks` and is proxied in dev by Vite (`/api -> http://localhost:3005`).
- The TypeScript collaboration server also provides similar REST endpoints backed by PostgreSQL.
- The client doesn’t call these REST endpoints from the collab save/load path; it tries `pg` directly.
- This duplication can cause configuration drift and confusion.

4) CORS / origin mismatches can break WebSocket/polling
- Local `.env` files set CORS origins to `http://localhost:3000` for both Backned and room server.
- Ensure the UI actually runs on port 3000 (Vite dev is configured to 3000). If you run on 5173 or a different port, the servers will reject requests (especially XHR/polling transports) due to CORS.

5) Backned router has a nested route bug (minor but confusing)
- In `Backned/src/routes.ts`, the `router.get("/", ...)` handler appears to contain a nested `router.get("/api/:id", ...)` before closing, which means the `/api/:id` route is registered at runtime when `/` is requested. This is not blocking for `/api/scenes`/`/api/permalinks` paths, but it’s confusing and brittle.

6) Student links are generated client-side only; permalinks API is unused
- `StudentLinkDialog.tsx` generates links with `#room=<id>,<key>` and saves them to `localStorage`. It doesn’t call `POST /api/permalinks`.
- App can resolve `?permalink=...` via `apiClient.resolvePermalink()` (see `excalidraw/excalidraw-app/App.tsx:234`), but there’s no corresponding creation path wired into UI.
- If the intent is “stable server-side permalinks,” the creation flow should call the backend and share `?permalink=...` URLs instead of pure `#room` URLs.

7) Nginx config doesn’t proxy to WS/API
- `excalidraw/nginx.conf` serves static content only. There is no proxy to the WS server (3002) or the API (3005). If deployed behind Nginx on a single domain, you need proxy blocks for `/socket.io` (WS) and `/api` (REST) to avoid mixed-origin/port issues in production.

---

**Likely Root Causes**
- Wrong collaboration server binary/URL (JS server with wrong event names).
- CORS/config mismatch (frontend not actually on `http://localhost:3000`).
- “Persistent rooms” path is non-functional in the browser (DB access attempted client-side), so scenes never load/persist via PostgreSQL.
- Permalink creation isn’t wired; only resolution is implemented.

---

**Verification Steps (no code changes)**
- Real-time server endpoint
  - Ensure app is pointing to the TS server with matching events.
  - Check `excalidraw/.env.development` and/or `excalidraw/excalidraw-app/.env.local`:
    - `VITE_APP_WS_SERVER_URL=http://localhost:3002`
  - Confirm which server is actually running on port 3002:
    - TS server logs contain: `init-room`, `server-broadcast/client-broadcast` events.
    - JS server logs won’t match those events.
- CORS
  - Confirm the UI runs on `http://localhost:3000` (Vite dev). If not, update `CORS_ORIGIN` in `Backned/.env` and `excalidraw-room/.env.development` to match.
  - Open DevTools Network panel and check for WebSocket connection upgrade. If it falls back to polling and fails CORS preflight, you’ll see 4xx and CORS errors.
- API health checks
  - `GET http://localhost:3005/health` (Backned) should return `{status:"ok"}`.
  - `GET http://localhost:3002/health` (room server TS) should return `{status:"ok"}`.
- Collaboration event flow
  - With two browser tabs, check if `client-broadcast` frames appear on one when drawing on the other (Network → WS).
  - If you see `client`/`server` only in frames, you’re on the wrong server.
- Persistent rooms
  - With `VITE_APP_PERSISTENT_ROOMS=true`, start a room and reload. If you don’t see initial scene load and there’s a console warning about PostgreSQL not available in browser, the client attempted DB access directly (as coded) and failed.

---

**Additional Issues Found (severity, what, where, why, fix)**

- Critical: Wrong WS server event names
  - Where: `excalidraw/excalidraw-room/src/index.js:1` vs client events in `excalidraw/excalidraw-app/app_constants.ts:18`
  - Why: JS server uses `server`/`client`, client expects `server-broadcast`/`client-broadcast` → no realtime.
  - Fix: Use only TS server `excalidraw-room/src/index.ts:150` and point `VITE_APP_WS_SERVER_URL` to it; remove/disable JS server.

- Critical: Raw body middleware captures JSON routes under /api/scenes
  - Where: `Backned/src/server.ts:13` (`app.use("/api/scenes/", express.raw(...))`)
  - Why: Express matches by prefix. This makes `POST /api/scenes/:roomId` see Buffer instead of JSON, causing 400 `invalid_payload`.
  - Fix: Apply `express.raw` only for the exact `POST /api/scenes/` route (exportToBackend) at route-level, and keep `:roomId` with `express.json`.

- Critical: Production backend URL not configured
  - Where: `excalidraw/railway.toml: [environments.production.variables]` and `excalidraw/.env.railway`
  - Why: No `VITE_APP_BACKEND_URL` → client defaults to `http://localhost:3005` in browser → broken in prod.
  - Fix: Set `VITE_APP_BACKEND_URL` to the public REST URL (Backned or TS-room REST).

- Critical: Browser attempts to use `pg` for persistence
  - Where: `excalidraw/excalidraw-app/data/postgresql.ts:1`, called from `excalidraw/excalidraw-app/collab/Collab.tsx:735`
  - Why: In browser, `getPool()` returns null → loads/saves no-op; rooms aren’t persisted or loaded.
  - Fix: Swap to REST (`apiClient.getScene/saveScene`) when `VITE_APP_PERSISTENT_ROOMS=true`.

- High: Nginx doesn’t proxy WS/API
  - Where: `excalidraw/nginx.conf:1`
  - Why: Static only; no `/socket.io` nor `/api` proxy → front can’t reach WS/API behind same origin.
  - Fix: Add proxy blocks for WebSocket and REST, or run them as separate services and configure CORS + correct URLs.

- High: StudentLinkDialog encoding/syntax errors
  - Where: `excalidraw/excalidraw-app/components/StudentLinkDialog.tsx:187` (`label="Usu�""`), `:189` (contains `\u0007` in string), multiple mis-encoded diacritics.
  - Why: JSX syntax error (extra quote) causes build failure; control chars and mojibake can break runtime.
  - Fix: Correct strings and ensure UTF‑8 file encoding.

- High: App-level `.env.local` ignored by Vite config
  - Where: `excalidraw/excalidraw-app/vite.config.mts:12,61` (`loadEnv(mode, "../")`, `envDir: "../"`)
  - Why: Env files are loaded from repo root. The file `excalidraw/excalidraw-app/.env.local` isn’t used.
  - Fix: Put env overrides in root `excalidraw/.env.*` files.

- High: Student name in `#room` links is unused
  - Where: `excalidraw/excalidraw-app/components/StudentLinkDialog.tsx:92` (adds `&student=`), but `excalidraw/excalidraw-app/App.tsx:220` only handles `?permalink=`.
  - Why: `&student=` query param is ignored for `#room` joins; name not set.
  - Fix: Parse `student` query param on app init for both permalinks and direct `#room` links.

- High: Duplicated REST backends (SQLite vs Postgres)
  - Where: Backned (SQLite) `Backned/src/routes.ts:1`, TS room (Postgres) `excalidraw-room/src/index.ts:111`
  - Why: Two REST surfaces for similar resources → config drift and confusion.
  - Fix: Choose one canonical REST backend and point the client to it.

- Medium: Confusing nested route in Backned router
  - Where: `Backned/src/routes.ts:11–33`
  - Why: `router.get("/api/:id")` appears nested inside `router.get("/")` block. It’s brittle and confusing.
  - Fix: Hoist `GET /api/:id` out as a top-level route.

- Medium: Shareable link API disabled in production by default
  - Where: `excalidraw/.env.production:4–8` commented `VITE_APP_BACKEND_V2_*`
  - Why: Export/import to backend (`#json=...`) won’t work in prod without these URLs.
  - Fix: Either configure these in prod or disable the feature in UI.

- Medium: Firebase required for image files even with Postgres scenes
  - Where: `excalidraw/excalidraw-app/collab/Collab.tsx:148` (FileManager) and `excalidraw/excalidraw-app/data/firebase.ts:1`
  - Why: Files are saved/loaded via Firebase. If `VITE_APP_FIREBASE_CONFIG` is empty in prod, image files fail.
  - Fix: Provide Firebase config (or add alternative file storage backend and branch logic in FileManager).

- Medium: CORS/origin mismatches during dev
  - Where: `Backned/.env:2` (`CORS_ORIGIN=http://localhost:3000`), `excalidraw-room/.env.development:2`
  - Why: If UI isn’t on 3000 (e.g., 5173), preflight/polling fails.
  - Fix: Align UI port and CORS origins.

- Low: Duplicate education env vars
  - Where: `excalidraw/.env.railway:15` (`VITE_APP_EDUCATIONAL_MODE`), elsewhere `VITE_APP_EDUCATION_MODE`
  - Why: Inconsistent naming; likely unused.
  - Fix: Remove/standardize.

- Low: Minor server cleanups
  - Where: `excalidraw-room/src/index.ts:39` (`express.static("public")` unused), `:268` (calling both `removeAllListeners()` and `disconnect()`)
  - Why: No functional impact; tidy up for clarity.

---

**Recommendations (no code shown here; high-level plan)**

1) Standardize on the TypeScript collaboration server
- Action:
  - Ensure only one server is used. Prefer `excalidraw-room/src/index.ts` (it matches client event names and also provides REST endpoints if needed).
  - Remove or rename `excalidraw/excalidraw-room` to avoid confusion.
  - Verify `VITE_APP_WS_SERVER_URL` points to the TS server.

2) Fix the persistence model: use REST from the browser, not `pg`
- Problem:
  - `excalidraw/excalidraw-app/collab/Collab.tsx` calls `saveToPostgreSQL`/`loadFromPostgreSQL` which can’t work in the browser.
- Plan:
  - When `VITE_APP_PERSISTENT_ROOMS=true`, switch to using `apiClient.getScene()`/`apiClient.saveScene()` against the Backned (or the TS server’s REST) endpoints from the browser.
  - Keep PostgreSQL access on the server side only.
  - Optionally: Merge the REST endpoints into a single backend; de-duplicate “Backned” and TS-room REST.

3) Wire up permalink creation in the UI
- Current:
  - `App.tsx` supports resolving `?permalink=...` via `apiClient.resolvePermalink()`.
  - `StudentLinkDialog.tsx` generates only `#room` links and doesn’t call `apiClient.createPermalink()`.
- Plan:
  - Decide on canonical link type. If you want stable server-side permalinks, update the student link generation to call `POST /api/permalinks` and distribute `?permalink=<code>` URLs (app will resolve to `#room=...` automatically).
  - Persist `student_name` via the API if needed (DB column exists in both servers).

4) Correct CORS and ports consistently
- Ensure the UI and servers agree on origin/port:
  - UI: `VITE_APP_PORT=3000` (Vite dev). Access via `http://localhost:3000`.
  - Backned: `CORS_ORIGIN=http://localhost:3000` (already set in `Backned/.env`).
  - Room server: `CORS_ORIGIN=http://localhost:3000` (already set in `excalidraw-room/.env.development`).
  - If you prefer 5173 or another port, update all CORS origins accordingly.

5) Fix the nested route in Backned router (cleanup)
- `Backned/src/routes.ts` has `router.get("/", ...)` that appears to enclose `router.get("/api/:id", ...)` by mistake. Untangle for clarity and predictable registration.

6) Add Nginx proxy rules for production
- If you serve everything under one domain in production, add proxy blocks to `nginx.conf`:
  - `/api` → your REST backend (Backned or TS-room server), including proper headers and timeouts.
  - `/socket.io` → your Socket.IO server with `upgrade` and `websocket` headers.

---

**Risk/Impact Assessment**
- Real-time: High risk of total failure if the wrong server is used due to mismatched events.
- Persistence: With the current browser→pg approach, “persistent rooms” won’t persist; scene recovery/load on join won’t work.
- Links: Client-only `#room` links work for joining live rooms, but there’s no server-side permalink management unless wired in.

---

**Proposed Execution Plan (incremental)**
- Step 1: Confirm and switch to the TS collaboration server; validate WS traffic (`client-broadcast/server-broadcast`).
- Step 2: Align CORS origins with the actual dev/prod UI URL; confirm WS upgrade succeeds.
- Step 3: Update the client persistence flow to use REST (`/api/scenes`) when `VITE_APP_PERSISTENT_ROOMS=true`. Keep Firebase fallback disabled if not used.
- Step 4: Decide on canonical link strategy and wire student link creation to `POST /api/permalinks` (or keep `#room` links and drop permalinks feature).
- Step 5: Clean up Backned router nesting. Optionally consolidate REST to a single backend to reduce duplication.
- Step 6: Add Nginx proxying for `/api` and `/socket.io` for production deployment (if applicable).

---

**Quick Reference (file pointers)**
- Client WS events: `excalidraw/excalidraw-app/app_constants.ts:1`
- Collab open/connect: `excalidraw/excalidraw-app/collab/Collab.tsx:~470` (uses `VITE_APP_WS_SERVER_URL`)
- TS room server events: `excalidraw-room/src/index.ts:~150` (`server-broadcast` → `client-broadcast`)
- JS room server (incompatible): `excalidraw/excalidraw-room/src/index.js:~60` (`server`/`client`)
- Client Postgres (browser-incompatible): `excalidraw/excalidraw-app/data/postgresql.ts:1`
- REST client (unused for persistence): `excalidraw/excalidraw-app/data/api-client.ts:1`
- Student link dialog: `excalidraw/excalidraw-app/components/StudentLinkDialog.tsx:1`
- Permalink resolve path: `excalidraw/excalidraw-app/App.tsx:234`
- Vite proxy (/api → 3005): `excalidraw/excalidraw-app/vite.config.mts:~20`
- Backned routes (note nesting): `Backned/src/routes.ts:1`
- Nginx (needs proxying if used): `excalidraw/nginx.conf:1`

---

If you want, I can proceed to implement the minimal changes to: 1) standardize the WS server, 2) switch persistence to REST, and 3) wire permalink creation in the UI. Let me know your preference (permalinks vs direct `#room` links) and which backend you want as the single source of truth.
