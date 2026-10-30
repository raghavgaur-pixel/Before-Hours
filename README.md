# AFTERHOURS

<p align="center">
  <strong>A WORLD THAT NEVER SLEEPS.</strong>
  <br />
  <em>Build your legacy. Defend it. Shape a world that moves on without you.</em>
</p>

<p align="center">
  A browser-based dark-fantasy strategy RPG in development
  <br />
  Built by the Before Hours project team · Hacktoberfest 2026
</p>

---

## The game

**AFTERHOURS** is a dark-fantasy strategy RPG built around one central idea: the world should not stop just because a player logs out.

Players are meant to establish settlements, manage resources, develop a character, explore a dangerous world, and make decisions that affect a shared multiplayer environment. The game combines the strategic scale of settlement management with the closer, character-driven experience of exploration and combat.

The long-term game is designed around a **persistent, asynchronous multiplayer world**. Players will not need to be online at the same time for the world to progress or for strategic consequences to unfold.

### The pillars of AFTERHOURS

| Pillar | The experience |
|---|---|
| **Build** | Found and expand a settlement, establish a foothold, and prepare it to survive in a hostile world. |
| **Manage** | Gather, store, and spend Wood, Stone, Food, and Iron to support your settlement. |
| **Develop** | Choose a character archetype and grow into a role that suits your playstyle. |
| **Explore** | Travel through a dark-fantasy world of forests, rivers, mountain passes, hamlets, and dangerous encounters. |
| **Fight** | Use melee weapons, ranged weapons, magic, defensive techniques, and abilities to survive combat. |
| **Endure** | The intended world simulation continues while players are away; your decisions should matter beyond a single session. |

**An important design choice:** construction is intended to be instant once its resource cost and placement are validated. There are no construction timers or building queues in the design. The persistent world simulation—not artificial waiting periods—is what makes the world move.

The intended starting resource set is **Wood, Stone, Food, and Iron**. The initial character archetypes are **Warrior, Gunslinger, Arcanist, and Battlemage**.

---

## Current milestone: a playable world prototype

The repository contains a working web application foundation and a substantial, locally simulated 3D gameplay slice. The current build focuses on making the world, characters, and combat tangible.

> **What you can explore in the current build:** a procedural hex-world scene, a third-person combat encounter, two switchable heroes, multiple weapons and abilities, enemy behaviour, civilians reacting to danger, wildlife, environmental details, and account registration/login backed by a Fastify API.

The distinction between the **game vision** and the **current implementation** matters. The 3D encounter is playable as a frontend prototype, but it is not yet the persistent, server-authoritative multiplayer game described above.

## Project status at a glance

| Area | Present in the repository | Current boundary |
|---|---|---|
| Frontend and navigation | Next.js application shell, landing page, login and registration screens | Settlement and Chronicle remain placeholders |
| Player accounts | Registration, login, logout and profile API integration | Account data is separate from the live encounter simulation |
| 3D world | Procedural 271-tile hex map, terrain, settlement scenery, minimap and environmental details | Map is generated locally and is not a persistent shared world |
| Combat encounter | Third-person controls, two switchable heroes, six weapons, abilities, stamina, dodging, blocking, parrying and enemy AI | Combat runs locally in the browser; it is not server-authoritative or multiplayer |
| Living environment | Hostile creatures, villagers, guards, wildlife and contextual interactions | NPC behaviour is part of the local prototype |
| Backend foundation | Fastify API, Prisma schema, PostgreSQL support and authentication tests | No world, settlement-economy or battle-state APIs yet |
| Standalone loading/login concept | Root-level HTML, panorama and optional Sketchfab scene files | Separate from the Next.js app and incomplete as committed |
| Persistent strategy gameplay | Product direction and initial account/resource models are established | Territory, construction, production, offline simulation, PvP and shared-world persistence remain future work |

This distinction is important: the current repository demonstrates a substantial 3D game prototype and an account/backend foundation. It does not yet represent the complete persistent multiplayer game described by the long-term vision.

## The world

### A hexagonal overworld

The current world is generated in the frontend using axial-style hex coordinates and procedural terrain variation.

- **271 hex tiles** arranged in a radius-9 map.
- Six terrain types: settlement grounds, meadow, farmland, darkwood, ashen peaks, and river.
- A central settlement with two outlying hamlets.
- Forests, mountain ranges, a winding river, bridges, and a waterfall.
- A minimap showing the map and relevant actors.
- Selectable tiles that can be inspected in overview mode.
- Terrain-aware movement: mountains and open water block movement, while bridges provide river crossings.
- Two camera modes: a third-person play camera and an overview camera.

The map is generated by frontend code. It is currently a local prototype rather than a world loaded from, saved to, or synchronised through the backend.

### A place that feels inhabited

The environment includes more than terrain and buildings:

- A central village and outlying hamlets.
- A cattle pen, graveyard, well, and bonfire.
- Forests, dead trees, lanterns, bridges, rocky mountain areas, and a river.
- An animated waterfall with moving water, foam, spray, and lighting.
- Ambient particles and environmental effects.
- Wildlife including cattle, wolves, deer, and crows.

### Civilians and hostile creatures

The settlement has civilians with different roles and routines, including villagers, farmers, guards, washers, shepherds, and children.

Civilians follow local routes. When danger gets close, non-guard civilians can flee toward hiding places, panic, and cower. Guards are more likely to hold their ground. Undead enemies can hunt civilians and knock them down, making the village feel like an environment that reacts to the encounter rather than a static backdrop.

The current enemy encounter includes:

- **Gravemaw:** a large hostile creature with movement, attack behaviour, health, hit reactions, and a defeat/respawn sequence.
- **Husks:** six roaming undead enemies that can hunt civilians, attack nearby heroes, be targeted, take damage, and be defeated.

---

## Combat

The current combat slice is a third-person, real-time encounter featuring two switchable heroes. These are the showcase encounter characters; they are separate from the four player archetypes planned for character creation and progression.

### The heroes

| Hero | Weapons | Signature ability |
|---|---|---|
| **Ashen Warden** | Wraith Blade · Hexstaff · Ashen Longbow | **Soul Rend** |
| **Iron Sentinel** | Siege Hammer · Ember Cannon · Bulwark Shield | **Earthshatter** |

The weapons cover melee, ranged, and magical attacks. Each weapon has its own damage, cooldown, and attack behaviour. The two signature abilities are powerful attacks with longer cooldowns.

### Combat systems in the prototype

- Direct third-person movement using keyboard controls.
- Mouse-look camera with pointer lock.
- Switching between the Ashen Warden and Iron Sentinel.
- Three weapons available to each hero.
- Light attacks, heavy attacks, and charged strong attacks.
- Weapon skills with individual cooldowns.
- Stamina consumption and regeneration.
- Blocking and timed parries.
- Dodge rolls with a brief invulnerability window.
- Sprinting.
- Lock-on targeting and target switching.
- One-handed and two-handed weapon stances. The two-handed stance trades slower recovery for increased damage.
- Ranged projectiles, spell effects, impact sparks, hit flashes, camera shake, and combat feedback.
- An optional local auto-battle mode for the heroes.

### Interactions and quick items

The encounter also includes small world interactions:

| Interaction | Current behaviour |
|---|---|
| **Bonfire** | Restores the selected hero's health and stamina. |
| **Well** | Restores some health. |
| **Cattle pen** | Displays a contextual interaction response. |
| **Graveyard** | Displays a contextual interaction response. |

The quick-item slots contain:

- **Healing Draught** — restores health.
- **Ember Flask** — deals fire damage to a target.
- **Spirit Salve** — temporarily reduces incoming damage.

The UI also includes local inventory, character status, equipment, map, and gesture panels. These are prototype interfaces; their contents are not yet connected to persistent player data.

### Controls

Click **Take Control** inside the world to activate the third-person controls.

| Action | Control |
|---|---|
| Move | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| Look around | Mouse movement |
| Light attack | Left mouse button |
| Heavy / charged attack | Hold <kbd>Shift</kbd> + left mouse button |
| Block / guard | Hold right mouse button |
| Parry | <kbd>Q</kbd> |
| Dodge / roll | <kbd>Space</kbd> |
| Sprint | Hold <kbd>Shift</kbd> while moving |
| Lock / unlock target | Middle mouse button |
| Switch target | <kbd>V</kbd> |
| Weapon skill | <kbd>E</kbd> |
| Switch weapon | <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd> |
| Cycle weapon | <kbd>[</kbd> / <kbd>]</kbd> or Page Up / Page Down |
| Switch hero | <kbd>X</kbd> |
| Two-handed stance | <kbd>C</kbd> |
| Interact | <kbd>F</kbd> |
| Use quick item | <kbd>R</kbd> |
| Change quick item | Mouse wheel |
| Inventory | <kbd>I</kbd> |
| Character status | <kbd>Tab</kbd> |
| Equipment | <kbd>K</kbd> |
| Map | <kbd>M</kbd> |
| Gestures | <kbd>G</kbd> |
| Auto-battle | <kbd>T</kbd> |
| Switch play / overview camera | <kbd>O</kbd> |
| Pause / settings | <kbd>Esc</kbd> |

### Suggested walkthrough for the current build

1. Start the frontend and backend using the commands below. Open the app at **http://localhost:3000**.
2. Visit **/register** to try account creation and choose one of the four starting archetypes, or use **/login** to sign in.
3. Open **/world** and choose **Take Control** to enter third-person play mode.
4. Move with **W**, **A**, **S**, and **D**; move the mouse to look around. Switch between the Warden and Sentinel with **X**, and cycle the selected hero's weapons with **1–3** or **[ / ]**.
5. Try the combat loop: attack with left-click, use a heavy or charged attack with **Shift + left-click**, block with right-click, parry with **Q**, dodge with **Space**, and activate the selected weapon's skill with **E**.
6. Explore the environment with **F** near the bonfire, well, cattle pen, or graveyard. Open the inventory, character, equipment, map, and gestures panels to inspect the supporting interface.
7. Press **O** to switch between the close third-person camera and map overview. Press **T** to toggle local auto-battle.

The encounter is a frontend simulation. Combat, NPCs, items, and map state are not shared with other players or saved as persistent gameplay progress.

## Application pages

| Route | Purpose | Status |
|---|---|---|
| **/** | Landing page and entry point | Implemented |
| **/register** | Account creation and character-archetype selection | Implemented |
| **/login** | Sign in with email or username | Implemented |
| **/world** | Hex-world scene and playable combat encounter | Playable frontend prototype |
| **/settlement** | Settlement management | Placeholder — coming soon |
| **/chronicle** | Player history and activity feed | Placeholder — coming soon |

---

## Backend and account system

The backend is a separate **Fastify 5** service written in TypeScript. It provides the current account and authentication foundation.

### Authentication API

All authentication routes are mounted under **/api/auth**.

| Method | Endpoint | Purpose |
|---|---|---|
| <kbd>POST</kbd> | **/api/auth/register** | Validates input and creates a user, character, and starter settlement. |
| <kbd>POST</kbd> | **/api/auth/login** | Authenticates with an email address or username and password. |
| <kbd>POST</kbd> | **/api/auth/logout** | Clears the authentication cookie. |
| <kbd>GET</kbd> | **/api/auth/me** | Returns the authenticated user's profile. |
| <kbd>GET</kbd> | **/health** | Backend health check. |

The authentication implementation includes:

- Zod validation for registration and login input.
- Password hashing with bcrypt.
- Seven-day JWT sessions.
- HTTP-only authentication cookies.
- Bearer-token support on the authenticated profile endpoint.
- CORS configured for the frontend.
- An optional Supabase Auth user-sync attempt when the relevant credentials are configured.

### Database model

The current Prisma schema contains three related PostgreSQL models.

| Model | Stored data |
|---|---|
| **User** | Email, username, password hash, and timestamps. |
| **Character** | Name, archetype, level, health, and base attributes such as strength, agility, endurance, and magic. |
| **Settlement** | Name and starting balances of Wood, Stone, Food, and Iron. |

A new settlement currently starts with **100 Wood, 100 Stone, 100 Food, and 50 Iron**. Character starting attributes are selected based on the chosen archetype.

When **DATABASE_URL** is configured, the service uses Prisma with PostgreSQL. Without it, authentication falls back to an in-memory store for local development and tests. In-memory data is lost when the backend process stops; it is not persistent account storage.

Supabase integration is optional. PostgreSQL through Prisma is the application's current database path.

### Tests

A Vitest suite is included for the authentication API. It covers the health endpoint, registration validation, duplicate accounts, login by email or username, invalid credentials, authenticated profile access, and logout behaviour.

The tests are present in the repository. Run the test command below to verify them in your environment.

---

## How the application fits together

The current architecture keeps the 3D encounter on the client and uses the backend for account operations.

~~~mermaid
flowchart TD
    Browser["Browser"]
    Frontend["Next.js + React frontend"]
    World["Three.js world and local combat simulation"]
    AuthUI["Login and registration UI"]
    API["Fastify API"]
    Auth["Authentication service"]
    Prisma["Prisma"]
    DB[("PostgreSQL")]
    Supabase["Optional Supabase Auth sync"]

    Browser --> Frontend
    Frontend --> World
    Frontend --> AuthUI
    AuthUI -->|"HTTP + cookie credentials"| API
    API --> Auth
    Auth --> Prisma
    Prisma --> DB
    Auth -.->|"Optional account sync"| Supabase
~~~

**Important current boundary:** the world map, player positions, enemies, NPC behaviour, combat state, items, and encounter HUD are frontend simulation state. They are not currently saved to the database or synchronised between multiple players. The backend currently stores accounts, one character, and one starter settlement per user.

---

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| 3D engine | Three.js |
| React 3D integration | React Three Fiber, Drei |
| Backend runtime and framework | Node.js, Fastify 5, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Input validation | Zod |
| Password security | bcryptjs |
| Sessions | JWT, HTTP-only cookies |
| Optional identity integration | Supabase JS |
| Backend tests | Vitest |

---

## Repository layout

~~~text
Before-Hours/
├── ability/                         # GLB ability and effect assets
├── backend/
│   ├── README.md
│   └── server/
│       ├── prisma/                   # Prisma schema
│       ├── src/
│       │   ├── config/               # Environment configuration
│       │   ├── lib/                  # Prisma and Supabase clients
│       │   ├── modules/auth/         # Auth routes, schemas, controller, service
│       │   └── plugins/              # Authentication and error handling
│       └── tests/                    # Authentication API tests
├── blender/                          # Reserved for Blender source projects
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/                      # Home, login, register, world, settlement, chronicle
│       ├── components/
│       │   ├── auth/                 # Authentication form
│       │   ├── layout/               # App shell, header, navigation, footer
│       │   └── world/                # Scene, terrain, characters, enemies, combat
│       └── lib/                      # Frontend API client
├── skin/
│   ├── backup-map/                   # Archived alternate map asset
│   ├── skin1/                         # Ashen Warden model and textures
│   └── skin2/                         # Stoneguard model and textures
├── NitroGen                          # Git submodule pointer
├── bg-login.png                      # Asset for standalone visual experiment
├── bg.js                             # Procedural pixel-art panorama experiment
├── controls.txt                      # Keyboard and mouse control reference
├── index.html                        # Standalone loading/login page experiment
├── scene.js                          # Loading screen and optional 3D-scene controller
├── package.json                      # Root development scripts
├── pnpm-workspace.yaml
└── README.md
~~~

### Standalone loading/login-page experiment

The repository root also contains **index.html**, **bg.js**, **scene.js**, and **bg-login.png**. These files form a separate **Before Hours** splash/login-page experiment; they are not part of the Next.js application under **frontend/** and are not the active authentication flow described above.

The experiment is incomplete in the current commit: **index.html** references **style.css** and **app.js**, but neither file is present in the repository. The procedural panorama in **bg.js** is also not loaded by the current **index.html**. Treat this as an unfinished standalone concept, not as a working alternate frontend. Its optional Sketchfab scene references **“Plaza Night Time” by patrix**, credited in the page markup under **CC BY-SA 4.0**.

### 3D asset notes

The repository includes four GLB assets under **ability/**, character models and textures under **skin/skin1/** and **skin/skin2/**, and an archived textured-map ZIP plus a texture reference under **skin/backup-map/**. The backup map is not the source of the current procedural hex world.

The current Warden, Sentinel, monsters, villagers, and much of the environment are built from procedural Three.js geometry and animation. The committed GLB files are project assets, but a complete in-game model/equipment loading pipeline is not yet integrated. The **blender/** directory is currently a placeholder and does not contain tracked **.blend** source projects.

A root-level **NitroGen** entry is present as a Git submodule pointer, but the repository currently has no **.gitmodules** file or URL for it. A fresh clone therefore cannot initialise that dependency from this repository alone; its source location needs to be documented before contributors can retrieve it.

---

## What is implemented, and what is still ahead?

| System | Current state |
|---|---|
| Next.js application shell and navigation | Implemented |
| Registration and login UI | Implemented |
| Fastify authentication API | Implemented |
| PostgreSQL account, character, and settlement schema | Implemented |
| Procedural hex-world prototype | Implemented in frontend |
| Third-person player controls | Implemented in frontend |
| Local combat encounter and enemy behaviour | Implemented in frontend |
| Civilians, wildlife, and environmental activity | Implemented in frontend |
| Settlement management gameplay | Not implemented yet |
| Functional resource production and economy | Not implemented yet |
| Instant building placement with validated costs | Design decision; gameplay implementation pending |
| Persistent world and tile data | Not implemented yet |
| Offline world simulation | Not implemented yet |
| Persistent character progression and inventory | Not implemented yet |
| Multiplayer world synchronisation | Not implemented yet |
| Server-authoritative PvP and battle resolution | Not implemented yet |
| Functional Chronicle and activity history | Not implemented yet |

The resource values shown in the current world HUD—such as Gold, Grain, Population, and Army—are placeholder presentation values. They are not a functioning economy and are not the project's agreed starting resource model. The backend settlement model currently uses Wood, Stone, Food, and Iron.

The current battle is also a local frontend prototype. It demonstrates movement, weapons, abilities, enemies, and encounter behaviour; it does not yet implement persistent battles, player-versus-player combat, or server-side validation of combat outcomes.

### The next major systems

The larger development work ahead is to connect the visual prototype to the persistent game:

1. **World persistence:** define worlds, tiles, player ownership, shared state, and player presence in the backend.
2. **Settlement gameplay:** connect the settlement interface to real stored data, resource costs, placement validation, and instant construction.
3. **Economy and simulation:** implement production, storage, resource deposits, transactions, and offline progression.
4. **Character systems:** persist progression, attributes, equipment, inventory, weapons, and abilities.
5. **Multiplayer:** introduce shared world state, server-authoritative combat, asynchronous battle resolution, PvP rules, and battle records.
6. **Chronicle:** record important player and world events in a functional activity history.
7. **Release readiness:** expand automated coverage, add deployment configuration, and harden production authentication and gameplay services.

---

## Run the project locally

### Requirements

- Node.js 20.9+
- npm
- PostgreSQL for persistent account storage

### 1. Clone the repository

~~~bash
git clone https://github.com/raghavgaur-pixel/Before-Hours.git
cd Before-Hours
~~~

### 2. Install dependencies

~~~bash
npm --prefix frontend install
npm --prefix backend/server install
~~~

### 3. Configure the backend

Create **backend/server/.env**. There is currently no tracked **.env.example** file.

~~~env
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
~~~

For a quick local run without PostgreSQL, leave the database variables unset and use the in-memory authentication fallback. Accounts created in this mode will not survive a backend restart.

For PostgreSQL-backed storage, configure both database URLs, then generate the Prisma client and push the schema:

~~~bash
npm --prefix backend/server run prisma:generate
npm --prefix backend/server run prisma:push
~~~

Use a strong, private **JWT_SECRET** outside local development. Never commit environment files or credentials.

### 4. Configure the frontend

Create **frontend/.env.local**:

~~~env
NEXT_PUBLIC_API_URL=http://localhost:4000
~~~

### 5. Start the services

Start the backend and frontend in separate terminals from the repository root.

Backend:

~~~bash
npm run dev:server
~~~

Frontend:

~~~bash
npm run dev:web
~~~

The frontend is normally available at **http://localhost:3000**. The backend listens on **http://localhost:4000** by default.

### Root scripts

| Command | Purpose |
|---|---|
| **npm run dev:web** | Start the Next.js frontend. |
| **npm run dev:server** | Start the Fastify backend in watch mode. |
| **npm run build:web** | Build the frontend. |
| **npm run build:server** | Compile the backend TypeScript. |
| **npm run test:server** | Run the backend Vitest suite. |

---

## Contributors

Thanks to everyone who has helped build the current project snapshot. The credits below use GitHub usernames.

| Contributor | Contributions | Relevant work |
|---|---|---|
| [@raghavgaur-pixel](https://github.com/raghavgaur-pixel) | Product direction, game specification, repository structure, development workflow, documentation, reviews, and milestone integration. | [PR #2](https://github.com/raghavgaur-pixel/Before-Hours/pull/2), [PR #8](https://github.com/raghavgaur-pixel/Before-Hours/pull/8), [PR #20](https://github.com/raghavgaur-pixel/Before-Hours/pull/20), [PR #26](https://github.com/raghavgaur-pixel/Before-Hours/pull/26) |
| [@Mohit-stu](https://github.com/Mohit-stu) | Frontend shell, 3D hex world, terrain, characters, creatures, environment, combat encounter, player controls, and waterfall. | [PR #6](https://github.com/raghavgaur-pixel/Before-Hours/pull/6), [PR #17](https://github.com/raghavgaur-pixel/Before-Hours/pull/17), [PR #18](https://github.com/raghavgaur-pixel/Before-Hours/pull/18), [PR #22](https://github.com/raghavgaur-pixel/Before-Hours/pull/22), [PR #25](https://github.com/raghavgaur-pixel/Before-Hours/pull/25) |
| [@chirrayu](https://github.com/chirrayu) | Fastify backend, Prisma models, authentication API, environment configuration, Supabase integration, error handling, tests, and frontend authentication integration. | [PR #13](https://github.com/raghavgaur-pixel/Before-Hours/pull/13), [PR #16](https://github.com/raghavgaur-pixel/Before-Hours/pull/16), [PR #21](https://github.com/raghavgaur-pixel/Before-Hours/pull/21) |
| [@Dark000099](https://github.com/Dark000099) | Character models and textures, ability assets, control reference, and archived alternate-map asset. | [PR #14](https://github.com/raghavgaur-pixel/Before-Hours/pull/14), [PR #19](https://github.com/raghavgaur-pixel/Before-Hours/pull/19), [PR #24](https://github.com/raghavgaur-pixel/Before-Hours/pull/24) |
| [@Skeleton-code0](https://github.com/Skeleton-code0) | Early standalone loading/login visual experiment and animated panorama work. | [Loading screen V1 commit](https://github.com/raghavgaur-pixel/Before-Hours/commit/19948eb6f7719c2f4f4d93df5d444f645dbc8566) |

---

## Development workflow

- **test** is the default integration branch. Contributor pull requests should target **test**.
- Contributors work from their existing personal branches; the project does not create a new branch for every feature.
- Review and verify changes on **test** before treating them as part of the integrated build.
- **main** is reserved for accepted milestone and presentation checkpoints. The maintainer promotes an approved **test** snapshot to **main**.
- Keep pull requests focused and include screenshots, recordings, or test evidence when relevant.

---

<p align="center">
  <strong>AFTERHOURS</strong>
  <br />
  <em>The world doesn't wait for you.</em>
  <br /><br />
  <sub>Built by the Before Hours project team · Hacktoberfest 2026</sub>
</p>
