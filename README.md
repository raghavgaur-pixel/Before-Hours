# AFTERHOURS
### A world that never sleeps.

> Build your legacy. Defend it. Shape a world that moves on without you.

**AFTERHOURS** is a browser-based, asynchronous multiplayer dark-fantasy strategy RPG. Its intended world combines settlements, character progression, swords, firearms, magic and player-versus-player conflict.

This repository is the project workspace. The current `test` branch contains an early 3D world prototype, a frontend shell, a backend authentication foundation and initial character/asset work. **It is not yet a complete or end-to-end playable multiplayer game.**

---

## Current implementation status

**Snapshot: `test` branch · 30 October 2026**

| Area | Current state |
|---|---|
| Frontend application | Next.js shell and dark-fantasy interface implemented |
| World presentation | Interactive 3D hex-tile prototype implemented |
| Characters and creatures | Procedural character, monster and wildlife visuals implemented |
| Battle presentation | Scripted monster-fight animation demo implemented |
| Backend | Fastify server foundation implemented |
| Authentication API | Registration, login, logout and current-profile endpoints implemented |
| Database model | Prisma models for users, characters and settlements implemented |
| Tests | Backend authentication tests included in the repository |
| Blender workspace | Folder reserved; no `.blend` project files committed yet |
| Persistent world simulation | Not implemented |
| Real PvP and combat rules | Not implemented |
| Frontend login/register flow | Pending review in PR #21; not yet in this branch |

The status labels below distinguish code that exists from visual demonstrations and planned game systems.

## Repository structure

```text
Before-Hours/
├── frontend/                 # Next.js application
│   ├── src/app/              # Home, World, Settlement and Chronicle routes
│   └── src/components/
│       ├── layout/           # Header, navigation, shell and footer
│       └── world/            # 3D world, terrain, characters and scene components
├── backend/
│   └── server/               # Fastify, Prisma, authentication and tests
├── blender/                  # Reserved for Blender source projects
├── ability/                  # GLB ability/effect assets
├── skin/                     # GLB character models and textures
├── NitroGen                  # Git submodule pointer; see asset note below
├── package.json              # Root development scripts
├── pnpm-workspace.yaml
└── README.md
```

### Current development commands

The root `package.json` provides:

| Command | Purpose |
|---|---|
| `npm run dev:web` | Start the frontend |
| `npm run dev:server` | Start the backend |
| `npm run build:web` | Build the frontend |
| `npm run build:server` | Compile the backend |
| `npm run test:server` | Run backend tests |

The frontend and backend each have their own package manifests. The current npm and pnpm workspace declarations list `backend/*`; they do not currently include `frontend` as a workspace package.

---

## Implemented frontend

**Technology:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Three.js, React Three Fiber and Drei.

### Application shell

The frontend currently includes:
- A shared application shell with header, footer and main content area.
- AFTERHOURS branding and a dark-fantasy colour theme.
- Desktop and responsive mobile navigation.
- A mobile menu with an accessible expanded state.
- A skip-to-content link and visible keyboard-focus styling.
- Home, World, Settlement and Chronicle routes.

The Settlement and Chronicle routes are placeholders. The home page links into the World view.

### 3D hex world prototype

The World route renders a client-side 3D scene built with React Three Fiber.

Implemented visual and interaction features:
- A finite hex-tile map generated at radius 9 (271 hexes).
- Axial-style `q/r` tile coordinates projected into 3D scene coordinates.
- Six current terrain labels: village, grass, farm, forest, mountain and water.
- Procedural terrain variation using value-noise calculations.
- A central village area and two outlying hamlet locations.
- A winding water feature and decorative bridges.
- Clickable hexes with selection highlighting and coordinate/terrain information.
- Orbit camera controls for rotation, zoom and panning.
- A 2D canvas minimap that highlights the selected tile.
- Decorative resource markers for wood, stone, grain and mine locations.
- Instanced forest and mountain geometry to reduce the number of separate scene objects.

**Important implementation boundary:** this map is generated locally in frontend code from fixed generation constants. It is not loaded from a backend map API, stored as a persistent world, generated from a player/world seed or authoritative for gameplay. The current `village` and `farm` values are presentation terrain labels, not a complete settlement/building/resource domain model.

### Characters, creatures and environment

The current scene includes procedural Three.js visuals and animation for:
- **Ashen Warden** — hooded sword-bearing character.
- **Iron Sentinel** — armoured golem with a hammer.
- **Gravemaw** — a horned monster with an animated health-bar presentation.
- **Wildlife** — cows, wolves, deer and crows.
- **Environment** — lanterns, dead trees, a graveyard, well, bonfire, cattle pen, bridges, trees, mountains and ambient particles.

The Ashen Warden, Iron Sentinel and Gravemaw in the current scene are assembled from basic Three.js geometry in code. The GLB files in `skin/` and `ability/` are repository assets; the current scene does not yet demonstrate a complete character/equipment asset-loading pipeline.

### Battle and HUD demonstration

A six-second animation cycle coordinates the Warden, Sentinel and Gravemaw movements. The scene includes hit flashes, weapon-swing motion, a camera-focus action and a battle-status panel.

This is a **scripted visual demonstration only**:
- It does not calculate real damage or resolve combat outcomes.
- Health values in the HUD are hardcoded demonstration values.
- There are no player-controlled attacks, PvP requests, battle records or server-authoritative combat results.
- The toolbar and side-rail items are mostly visual buttons without implemented actions. The Focus Battle button moves the camera to the demonstration.

The resource HUD is also placeholder data. Its displayed Gold, Wood, Stone, Grain, Population and Army values are not connected to the backend or a real economy.

---

## Implemented backend

**Technology:** Node.js 20+, Fastify 5, TypeScript, Prisma 6, PostgreSQL, Zod, JWT, bcryptjs, Vitest and optional Supabase integration.

The backend service is located at `backend/server/`.

### Server foundation

Implemented:
- Fastify application factory and server startup.
- Environment parsing and validation with Zod.
- CORS configuration with credentials and configurable allowed origins.
- Cookie and JWT plugins.
- An authentication decorator for protected routes.
- A shared error handler for validation and server errors.
- A health endpoint at `GET /health`.

### Authentication API

Routes are mounted under `/api/auth`.

| Method | Endpoint | Current behaviour |
|---|---|---|
| POST | `/api/auth/register` | Validates registration, hashes the password, creates the user and initial character/settlement, then issues a JWT |
| POST | `/api/auth/login` | Accepts email or username plus password and issues a JWT |
| POST | `/api/auth/logout` | Clears the authentication cookie |
| GET | `/api/auth/me` | Returns the authenticated player's profile |

Registration validation currently checks:
- Email format and normalization.
- Username length (3–20 characters) and allowed characters.
- Password length (8–100 characters).
- Archetype selection: warrior, gunslinger, arcanist or battlemage.

Passwords are hashed with bcryptjs. JWTs are configured with a seven-day expiry and are also set in an HTTP-only cookie. The profile endpoint accepts JWT authentication through the configured cookie or an Authorization bearer token.

When `DATABASE_URL` is configured, account data is stored through Prisma. Without it, the service has an in-memory fallback intended for local development and tests; that fallback is not durable storage. If a Supabase service-role configuration is present, registration also attempts a non-blocking Supabase Auth user sync.

### Database schema

The current Prisma schema contains three models:

| Model | Stored information |
|---|---|
| `User` | Unique email and username, password hash and timestamps |
| `Character` | One character per user, name, archetype, level, health and base attributes |
| `Settlement` | One settlement per user, name and initial Wood, Stone, Food and Iron balances |

The registration service creates a starting character and settlement. Initial character attributes are influenced by the selected archetype. The schema does not yet define worlds, hex tiles, buildings, inventories as separate entities, weapons, combat, factions or activity events.

### Backend tests

A Vitest authentication test file is included. It covers the health endpoint, successful registration, invalid registration input, duplicate email/username, email/username login, invalid credentials, authenticated and unauthenticated profile access, and logout-cookie behaviour.

The tests are present in the repository; this README does not claim they have been run successfully in every environment. No frontend test suite or CI workflow is currently included in the tracked project tree.

---

## 3D asset inventory

The repository currently contains the following binary assets:

| Location | Contents |
|---|---|
| `ability/` | Four GLB files for magical/effect assets |
| `skin/skin1/` | `VEYLORN — The Ashen Warden.glb` and texture images |
| `skin/skin2/` | `STONEGUARD.glb` and texture images |
| `blender/` | README placeholder only; no Blender `.blend` source project is currently tracked |

The `NitroGen` path is stored as a Git submodule pointer. The current repository tree has no `.gitmodules` file or submodule URL for it, so its external source is not configured/documented in this checkout.

---

## Implementation credits

The following credits refer to contributions merged into the current `test` branch. GitHub usernames are used as requested.

| GitHub account | Implemented contribution | Relevant PRs |
|---|---|---|
| [`@Mohit-stu`](https://github.com/Mohit-stu) | Frontend application shell, responsive layout and navigation; 3D hex-world prototype; terrain, minimap, characters, props, wildlife, dark-village scenery and scripted monster-battle presentation | [#6](https://github.com/raghavgaur-pixel/Before-Hours/pull/6), [#17](https://github.com/raghavgaur-pixel/Before-Hours/pull/17), [#18](https://github.com/raghavgaur-pixel/Before-Hours/pull/18) |
| [`@chirrayu`](https://github.com/chirrayu) | Fastify backend foundation, Prisma schema, authentication API, environment/configuration, Supabase integration, error handling and backend authentication tests; moved the server into `backend/server/` | [#13](https://github.com/raghavgaur-pixel/Before-Hours/pull/13), [#16](https://github.com/raghavgaur-pixel/Before-Hours/pull/16) |
| [`@Dark000099`](https://github.com/Dark000099) | Character skin GLB models, associated textures and magical ability GLB assets | [#14](https://github.com/raghavgaur-pixel/Before-Hours/pull/14), [#19](https://github.com/raghavgaur-pixel/Before-Hours/pull/19) |
| [`@raghavgaur-pixel`](https://github.com/raghavgaur-pixel) | Product direction and documentation, repository folder reorganisation, branch/PR workflow and milestone integration | [#8](https://github.com/raghavgaur-pixel/Before-Hours/pull/8), [#20](https://github.com/raghavgaur-pixel/Before-Hours/pull/20) |

### Work currently under review

[`PR #21 — CORS established`](https://github.com/raghavgaur-pixel/Before-Hours/pull/21) from `@chirrayu` is open and targets `test`. Its changes include frontend login/register pages, a shared authentication form, a frontend API client and backend environment/configuration adjustments. **Those changes are not counted as implemented in this README until they are merged into `test`.**

---

## Not implemented yet

The following are project goals or future implementation work, not features that should be assumed to exist in the current branch:

- Frontend login/register flow and client-side authenticated-session handling (pending PR #21).
- Persistent world creation, server-side map generation, world seed management and hex-tile database/API.
- Settlement ownership, placement validation, territory and multiplayer world-state rules.
- Real resource production, storage caps, resource deposits and economic transactions.
- Building catalogue and building placement/upgrade commands. The agreed product rule is **instant construction after validation and payment**—no construction timers, queues or construction-progress graphics.
- Character levelling, equipment inventory, weapon statistics, swords/guns/magic abilities and player-controlled combat.
- Actual PvP, asynchronous battle resolution, defensive/offline protection, combat rewards and persistent battle records.
- Offline world simulation worker and restart-safe progression.
- Activity history/Chronicle data and world events.
- Functional implementations behind the World HUD's Build, Town, Research, Council, Army, Scout and Settings controls.
- Production Blender source projects and an integrated GLB asset-loading pipeline.
- Frontend automated tests, CI checks and a verified deployment workflow.

## Current product and contribution workflow

- `test` is the default integration branch. Contributor PRs should target `test`.
- Contributors work from their existing personal branches; do not create a new branch per feature.
- Review and test changes on `test` before treating them as part of the integrated project.
- `main` is reserved for approved milestone/submission checkpoints. The maintainer promotes an accepted `test` snapshot into `main`.
- Do not push directly to `main`. Keep PRs focused and include appropriate tests or screenshots.

## Known setup and implementation notes

- The backend README refers to copying `backend/server/.env.example`, but that example file is not currently tracked. Configure the required environment values from the documented settings or add a safe example template in a separate contribution.
- The backend environment parser currently supplies a development JWT secret as a default. A strong secret must be supplied and enforced for production before deployment.
- The workspace declarations currently include `backend/*` but not `frontend`; the root scripts run the frontend separately through `npm --prefix frontend`.
- The homepage still contains older copy implying construction continues while the player is away. This conflicts with the current product decision that construction is instant.
- The current map and HUD are frontend demonstrations. They must not be treated as authoritative player or world state.

---

*AFTERHOURS — The world doesn't wait for you.*

*Built under the Before Hours project.*



npm.cmd --prefix backend/server run dev
npm.cmd --prefix frontend run dev