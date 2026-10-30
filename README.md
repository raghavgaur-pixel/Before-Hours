# AFTERHOURS

### A world that never sleeps.

> **Build your legacy. Defend it. Shape a world that moves on without you.**

AFTERHOURS is a browser-based dark-fantasy strategy RPG in development. It is designed around a persistent, asynchronous multiplayer world where players establish settlements, manage resources, develop characters, explore dangerous territories, and fight with steel, firearms, and magic.

The long-term vision is a world that continues to evolve while its players are away. Construction is designed to be **instant once its cost and placement are validated**; the persistent simulation, rather than construction timers, is what makes the world move.

**Current milestone:** the repository contains a playable third-person 3D encounter inside a procedural hex-world prototype, a working frontend authentication flow, and a Fastify backend foundation. The full persistent multiplayer strategy game is still under development.

---

## What is AFTERHOURS?

AFTERHOURS combines two connected layers of play:

- **Build and govern:** establish a stronghold, gather and manage resources, expand territory, and prepare your settlement to survive a hostile world.
- **Explore and fight:** develop a character, wield different weapon types and abilities, encounter hostile creatures, and eventually contest the world with other players.

The intended resource foundation is **Wood, Stone, Food, and Iron**. The intended character paths begin with four archetypes: **Warrior, Gunslinger, Arcanist, and Battlemage**.

The current build focuses on bringing the world and its combat to life. Settlement management, persistent world simulation, and multiplayer systems are future implementation work—not features represented by the current 3D demo.

## Project status at a glance

| Area | Present in the repository | Current boundary |
|---|---|---|
| Frontend and navigation | Next.js application shell, landing page, login and registration screens | Settlement and Chronicle remain placeholders |
| Player accounts | Registration, login, logout and profile API integration | Account data is separate from the live encounter simulation |
| 3D world | Procedural 271-tile hex map, terrain, settlement scenery, minimap and environmental details | Map is generated locally and is not a persistent shared world |
| Combat encounter | Third-person controls, two switchable heroes, six weapons, abilities, stamina, dodging, blocking, parrying and enemy AI | Combat runs locally in the browser; it is not server-authoritative or multiplayer |
| Living environment | Hostile creatures, villagers, guards, wildlife and contextual interactions | NPC behaviour is part of the local prototype |
| Backend foundation | Fastify API, Prisma schema, PostgreSQL support and authentication tests | No world, settlement-economy or battle-state APIs yet |
| Persistent strategy gameplay | Product direction and initial account/resource models are established | Territory, construction, production, offline simulation, PvP and shared-world persistence remain future work |

This distinction is important: the current repository demonstrates a substantial 3D game prototype and an account/backend foundation. It does not yet represent the complete persistent multiplayer game described by the long-term vision.

## The current build

### 3D world and exploration

The `/world` page opens a real-time Three.js scene rendered with React Three Fiber.

The current world contains:

- A procedurally generated **hexagonal map** with 271 tiles, arranged in a radius-9 layout.
- Six terrain types: settlement grounds, meadow, farmland, darkwood, ash-covered mountains, and river.
- A central settlement, outlying hamlets, forests, mountain ranges, a winding river, bridges, and a waterfall.
- A minimap showing the world, heroes, enemies, and the selected tile.
- Clickable tiles that can be inspected in overview mode.
- A third-person camera for direct character control, plus an overview camera for looking across the map.
- Visible resource landmarks for wood, stone, grain, and mining locations.

The terrain is generated in frontend code using axial-style hex coordinates, seeded variation, and procedural noise. It is currently a local prototype map—not a persistent world loaded from the backend.

### Playable combat encounter

The current encounter features two switchable heroes:

| Hero | Weapons | Signature ability |
|---|---|---|
| **Ashen Warden** | Wraith Blade (melee), Hexstaff (magic), Ashen Longbow (ranged) | **Soul Rend** |
| **Iron Sentinel** | Siege Hammer (melee), Ember Cannon (ranged), Bulwark Shield (melee) | **Earthshatter** |

The combat prototype includes:

- Direct third-person movement and mouse-look camera control.
- Switching between the Warden and Sentinel.
- Light attacks, heavy attacks, charged strong attacks, and weapon skills.
- Weapon cooldowns, damage values, stamina costs, and stamina regeneration.
- Blocking, timed parries, dodge rolls with brief invulnerability, and sprinting.
- Lock-on targeting and target switching.
- One-handed and two-handed weapon stances. The two-handed stance increases damage while slowing recovery.
- Ranged projectiles, impact effects, hit flashes, camera shake, and combat logs.
- A local auto-battle option for the heroes.

### Enemies and a living environment

The encounter is more than a static arena:

- **Gravemaw** is a large hostile creature with its own attack behaviour, health, movement, and defeat/respawn sequence.
- **Husks** are roaming undead enemies. They hunt nearby villagers, can knock civilians down, and will turn on a hero who gets close.
- **Villagers** follow routes around the settlement. When danger approaches, many flee toward hiding places; guards are more likely to hold their ground.
- **Wildlife** includes cattle, wolves, deer, and crows.
- **World details** include lanterns, dead trees, a graveyard, a well, a cattle pen, a bonfire, bridges, forests, mountains, and ambient particles.

### Interactions and in-game panels

The current prototype also includes local interactions and interface panels:

- Rest at the bonfire to restore health and stamina.
- Visit the well to recover health.
- Interact with the cattle pen and graveyard for contextual responses.
- Open the inventory, character status, equipment, map, and gestures panels.
- Use quick items: Healing Draught, Ember Flask, and Spirit Salve.

These interactions, combat values, item counts, and world entities currently live in the frontend simulation. They are not yet saved to a player account or synchronised between players.

## Controls

Click **Take Control** when entering the world to enable the third-person controls.

| Action | Control |
|---|---|
| Move | `W` `A` `S` `D` |
| Look around | Mouse movement |
| Light attack | Left mouse button |
| Heavy attack | Quick `Shift` + left-click |
| Charged strong attack | Hold `Shift` + left-click |
| Block / guard | Hold right mouse button |
| Parry | `Q` |
| Dodge / roll | `Space` |
| Sprint | Hold `Shift` while moving |
| Lock / unlock target | Middle mouse button |
| Switch target | `V` |
| Weapon skill | `E` |
| Switch weapon | `1`, `2`, `3` |
| Cycle weapon | `[` / `] ` or Page Up / Page Down |
| Switch hero | `X` |
| Two-handed stance | `C` |
| Interact | `F` |
| Use quick item | `R` |
| Change quick item | Mouse wheel |
| Inventory | `I` |
| Character status | `Tab` |
| Equipment | `K` |
| Map | `M` |
| Gestures | `G` |
| Auto-battle | `T` |
| Switch play / overview camera | `O` |
| Pause / settings | `Esc` |

### Suggested walkthrough for the current build

1. Start the frontend and backend using the commands below. Open the app at `http://localhost:3000`.
2. Visit `/register` to try account creation and choose one of the four starting archetypes, or use `/login` to sign in.
3. Open `/world` and choose **Take Control** to enter third-person play mode.
4. Move with `W`, `A`, `S`, and `D`; move the mouse to look around. Switch between the Warden and Sentinel with `X`, and cycle the selected hero's weapons with `1`–`3` or `[` / `]`.
5. Try the combat loop: attack with left-click, use a heavy or charged attack with `Shift` + left-click, block with right-click, parry with `Q`, dodge with `Space`, and activate the selected weapon's skill with `E`.
6. Explore the environment with `F` near the bonfire, well, cattle pen or graveyard. Open the inventory, character, equipment, map and gestures panels to inspect the supporting interface.
7. Press `O` to switch between the close third-person camera and map overview. Press `T` to toggle local auto-battle.

The encounter is a frontend simulation. Combat, NPCs, items and map state are not shared with other players or saved as persistent gameplay progress.

## Application pages

| Route | Purpose | Status |
|---|---|---|
| `/` | Landing page and entry point | Implemented |
| `/register` | Create an account and choose a character archetype | Implemented |
| `/login` | Sign in with email or username | Implemented |
| `/world` | 3D hex world and playable combat encounter | Implemented prototype |
| `/settlement` | Settlement management interface | Placeholder |
| `/chronicle` | Player history and activity feed | Placeholder |

---

## Backend and account system

The backend is a separate Fastify service written in TypeScript. It currently provides the account foundation used by the frontend login and registration forms.

### Authentication API

All authentication endpoints are mounted under `/api/auth`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Creates an account and starter character and settlement |
| `POST` | `/api/auth/login` | Signs in using an email or username and password |
| `POST` | `/api/auth/logout` | Clears the session cookie |
| `GET` | `/api/auth/me` | Returns the authenticated player's profile |
| `GET` | `/health` | Backend health check |

Registration validates the email, username, password, and selected archetype. Passwords are hashed with bcrypt. The API issues a seven-day JWT and sets it in an HTTP-only cookie; the profile endpoint also supports bearer-token authentication.

### Current data model

The Prisma schema currently defines three related models:

| Model | What it stores |
|---|---|
| `User` | Email, username, password hash, and timestamps |
| `Character` | Character name, archetype, level, health, and base attributes |
| `Settlement` | Settlement name and starter Wood, Stone, Food, and Iron balances |

A new account receives a level-1 character and a starter settlement. The selected archetype influences the character's initial attributes.

When `DATABASE_URL` is configured, the service uses Prisma with PostgreSQL. Without a database URL, it falls back to an in-memory store for local development and tests; data in that mode is lost when the server stops. Supabase Auth synchronisation is optional and only attempted when the relevant environment configuration is present.

### Backend tests

A Vitest suite is included for the authentication API. It covers health checks, registration validation, duplicate accounts, login with email or username, invalid credentials, authenticated profile access, and logout behaviour. The tests are included in the repository; their presence should not be read as a claim that every environment or deployment has been verified.

---

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| 3D rendering | Three.js, React Three Fiber, Drei |
| Backend | Node.js, Fastify 5, TypeScript |
| Database access | Prisma 6, PostgreSQL |
| Validation | Zod |
| Authentication | JWT, HTTP-only cookies, bcryptjs |
| Optional service integration | Supabase JS |
| Backend testing | Vitest |

## Repository structure

```text
Before-Hours/
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/                  # Home, login, register, world, settlement, chronicle
│       ├── components/
│       │   ├── auth/             # Login and registration form
│       │   ├── layout/           # App shell, header, navigation, footer
│       │   └── world/            # 3D scene, terrain, characters, enemies, combat
│       └── lib/                  # Frontend API client
├── backend/
│   └── server/
│       ├── prisma/               # Prisma database schema
│       ├── src/
│       │   ├── config/           # Environment configuration
│       │   ├── lib/              # Prisma and Supabase clients
│       │   ├── modules/auth/     # Authentication routes, schemas and services
│       │   └── plugins/          # Authentication and error handling
│       └── tests/                # Backend authentication tests
├── blender/                      # Reserved for Blender source projects
├── ability/                      # GLB ability/effect assets
├── skin/                         # Character models, textures and related assets
├── controls.txt                  # Keyboard and mouse control reference
├── NitroGen                      # Git submodule pointer; see the asset note below
├── package.json                  # Root development scripts
├── pnpm-workspace.yaml
└── README.md
```

### 3D asset notes

The repository includes four GLB assets under `ability/`, character models and textures under `skin/skin1/` and `skin/skin2/`, and an archived textured-map ZIP plus a texture reference under `skin/backup-map/`. The backup map is not the source of the current procedural hex world.

The current Warden, Sentinel, monsters, villagers, and much of the environment are built from procedural Three.js geometry and animation. The committed GLB files are project assets, but a complete in-game model/equipment loading pipeline is not yet integrated. The `blender/` directory is currently a placeholder and does not contain tracked `.blend` source projects.

A root-level `NitroGen` entry is present as a Git submodule pointer, but the repository currently has no `.gitmodules` file or URL for it. A fresh clone therefore cannot initialise that dependency from this repository alone; its source location needs to be documented before contributors can retrieve it.

---

## What is still being built?

The current milestone establishes the visual world, local combat prototype, account flow, and backend foundation. The following systems remain future work:

- **Persistent multiplayer world:** world creation, player presence, shared map state, and server-authoritative world data.
- **Settlement gameplay:** ownership, territory, building catalogue, placement validation, upgrades, and management interfaces.
- **Economy:** production, storage, resource deposits, transactions, and the Wood / Stone / Food / Iron gameplay loop.
- **Character progression:** levelling, attributes, equipment, inventory, and persistent weapon/ability data.
- **Multiplayer combat:** PvP, asynchronous battle resolution, persistent battle records, rewards, and defensive rules.
- **Offline simulation:** world and production updates that continue while players are away.
- **World history:** events, activity records, and a functional Chronicle.
- **Production readiness:** server-authoritative gameplay, persistence for combat and world state, frontend test coverage, CI, deployment configuration, and security hardening.

The current combat encounter is a **client-side prototype**, not a competitive or server-authoritative combat system. The map, enemies, NPC behaviour, player positions, combat state, and HUD resource figures are not persisted or synchronised. The Gold / Grain / Population / Army figures shown in the HUD are placeholder presentation data; they are not the agreed resource model or a working economy.

---

## Running locally

### Requirements

- Node.js 20+
- npm
- PostgreSQL, when database-backed account persistence is required

### 1. Clone the repository

```bash
git clone https://github.com/raghavgaur-pixel/Before-Hours.git
cd Before-Hours
```

### 2. Install dependencies

```bash
npm --prefix frontend install
npm --prefix backend/server install
```

### 3. Configure the backend

Create `backend/server/.env`. There is currently no tracked `.env.example` file.

For local development without PostgreSQL, you can leave the database variables unset and use the in-memory authentication fallback. To use PostgreSQL, configure both database URLs and initialise the Prisma schema.

Example:

```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
JWT_SECRET=replace-this-with-a-long-random-secret
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# Optional Supabase Auth integration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For a PostgreSQL-backed setup, generate the Prisma client and push the schema:

```bash
npm --prefix backend/server run prisma:generate
npm --prefix backend/server run prisma:push
```

Use a private, strong `JWT_SECRET` outside local development. Do not commit environment files or credentials.

### 4. Configure the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 5. Start the application

Run the backend and frontend in separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:web
```

The frontend runs on the Next.js development server (normally `http://localhost:3000`), while the backend listens on port `4000` by default.

### Other root commands

| Command | Purpose |
|---|---|
| `npm run build:web` | Build the frontend |
| `npm run build:server` | Compile the backend |
| `npm run test:server` | Run backend Vitest tests |

---

## Contributors

Credits below reflect contributions merged into the current `test` branch. GitHub usernames are used for contributor attribution.

| Contributor | Contributions | Relevant PRs |
|---|---|---|
| [`@Mohit-stu`](https://github.com/Mohit-stu) | Frontend shell and navigation; 3D hex world; terrain, characters, creatures, environment, battle encounter, player controls, stamina combat, and waterfall/world details | [#6](https://github.com/raghavgaur-pixel/Before-Hours/pull/6), [#17](https://github.com/raghavgaur-pixel/Before-Hours/pull/17), [#18](https://github.com/raghavgaur-pixel/Before-Hours/pull/18), [#22](https://github.com/raghavgaur-pixel/Before-Hours/pull/22), [#25](https://github.com/raghavgaur-pixel/Before-Hours/pull/25) |
| [`@chirrayu`](https://github.com/chirrayu) | Fastify backend, Prisma data models, authentication API, environment configuration, Supabase integration, error handling, authentication tests, and frontend login/register integration | [#13](https://github.com/raghavgaur-pixel/Before-Hours/pull/13), [#16](https://github.com/raghavgaur-pixel/Before-Hours/pull/16), [#21](https://github.com/raghavgaur-pixel/Before-Hours/pull/21) |
| [`@Dark000099`](https://github.com/Dark000099) | Character model and texture assets, ability GLB assets, and the control reference document | [#14](https://github.com/raghavgaur-pixel/Before-Hours/pull/14), [#19](https://github.com/raghavgaur-pixel/Before-Hours/pull/19), [#24](https://github.com/raghavgaur-pixel/Before-Hours/pull/24) |
| [`@raghavgaur-pixel`](https://github.com/raghavgaur-pixel) | Product direction, game specification and documentation, repository structure, contributor workflow, PR reviews, and milestone integration | [#2](https://github.com/raghavgaur-pixel/Before-Hours/pull/2), [#8](https://github.com/raghavgaur-pixel/Before-Hours/pull/8), [#20](https://github.com/raghavgaur-pixel/Before-Hours/pull/20), [#26](https://github.com/raghavgaur-pixel/Before-Hours/pull/26) |

## Development workflow

- `test` is the default integration branch. Contributor pull requests should target `test`.
- Contributors use their existing personal branches; the project does not create a new branch for every feature.
- Review and verify work on `test` before considering it part of the integrated build.
- `main` is reserved for approved milestone and presentation checkpoints. The maintainer promotes an accepted `test` snapshot to `main`.
- Keep pull requests focused and include screenshots or test evidence when relevant.

---

<p align="center">
  <strong>AFTERHOURS</strong><br />
  <em>The world doesn't wait for you.</em>
</p>

<p align="center">
  Built under the <strong>Before Hours</strong> project.
</p>
