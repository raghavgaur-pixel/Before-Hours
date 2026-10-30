# AFTERHOURS
### A world that never sleeps.

> Build something that remains after you leave.

**AFTERHOURS** is a browser-based, asynchronous multiplayer dark-fantasy civilization simulator. Players establish settlements in a shared persistent world, gather and produce resources, construct buildings, develop local economies, and eventually compete over land and influence.

The defining feature is persistence: **the world continues to progress when a player closes the browser or logs out.** Production accumulates, construction finishes, and the history of the world continues to be written.

This repository is the home of the AFTERHOURS project. It documents the product vision, game rules, simulation principles, technical architecture, and development roadmap.

---

## Contents

- [Project at a glance](#project-at-a-glance)
- [The vision](#the-vision)
- [World and setting](#world-and-setting)
- [Core gameplay loop](#core-gameplay-loop)
- [The persistent-world principle](#the-persistent-world-principle)
- [Game systems](#game-systems)
  - [World map and isometric presentation](#world-map-and-isometric-presentation)
  - [Settlements](#settlements)
  - [Resources and economy](#resources-and-economy)
  - [Buildings and construction](#buildings-and-construction)
  - [Time, simulation, and game physics](#time-simulation-and-game-physics)
  - [Ownership and multiplayer](#ownership-and-multiplayer)
  - [World history and events](#world-history-and-events)
- [MVP scope](#mvp-scope)
- [Future possibilities](#future-possibilities)
- [Technology stack](#technology-stack)
- [Technical architecture](#technical-architecture)
- [Data and domain model](#data-and-domain-model)
- [Security and game integrity](#security-and-game-integrity)
- [Development principles](#development-principles)
- [Team roles and phase-by-phase ownership](#team-roles-and-phase-by-phase-ownership)
- [Pull request strategy](#pull-request-strategy)
- [Roadmap](#roadmap)
- [Repository and contribution workflow](#repository-and-contribution-workflow)
- [Glossary](#glossary)
- [Project status](#project-status)

---

## Project at a glance

| Category | Decision |
|---|---|
| Project | AFTERHOURS |
| Repository | Before-Hours |
| Genre | Persistent multiplayer civilization / strategy simulator |
| Setting | Dark fantasy |
| Presentation | Isometric 2.5D |
| Platform | Web browser |
| Multiplayer | Asynchronous |
| World model | Shared and persistent |
| Initial scope | One playable world; settlement and economy MVP |
| Primary experience | Build, produce, plan, return, and discover what changed |

### The one-sentence pitch

A dark-fantasy civilization simulator in which players build settlements and shape a shared world that keeps evolving long after they log off.

## The vision

Most multiplayer games depend on players being online at the same time. AFTERHOURS is built around a different idea.

A player should be able to make meaningful decisions, leave the game, return hours later, and find that time has passed in the world. Their settlement may have finished an upgrade. Its buildings may have produced resources. Other players may have expanded their own settlements. The world should feel like a place that exists independently of any one player's session.

The long-term vision is a player-influenced world with:

- Settlements that grow and develop.
- Resources that are produced, stored, consumed, and traded.
- A world map with meaningful geography.
- Factions, alliances, diplomacy, and territorial competition.
- Conflicts whose outcomes are determined by game rules.
- A persistent historical record of important events.

These are design goals, not promises that every system will exist in the first release. The MVP deliberately focuses on a small, reliable slice of the experience.

### Design pillars

1. **Persistence:** logging out does not pause the world.
2. **Meaningful decisions:** resources, construction, location, and time should matter.
3. **Player-driven history:** important events should emerge from player actions and simulation rules, not only scripted stories.
4. **Readable strategy:** the interface should communicate the state of a settlement and the world clearly.
5. **Trustworthy simulation:** the server, not the browser, determines gameplay outcomes.
6. **Expandable foundations:** future systems should build on understandable, testable rules.

## World and setting

AFTERHOURS takes place in a dark-fantasy world shaped by old kingdoms, abandoned roads, ancient forests, rugged highlands, forgotten ruins, and isolated settlements.

The tone should be atmospheric and grounded. The world can contain mystery and fantasy, but the first playable experience is about survival, settlement development, resource management, and gradual expansion—not a story campaign.

### Visual direction

- Dark, atmospheric medieval-fantasy art direction.
- Isometric 2.5D world presentation.
- Distinct terrain silhouettes and readable settlement structures.
- Muted natural colors, with restrained magical or supernatural accents.
- Clear resource, construction, and ownership indicators.
- Interface prioritizes legibility over decorative effects.

The isometric map is the way players observe the world. It is not the underlying simulation itself: the world is stored as logical map data, and the client renders that data.

## Core gameplay loop

The first playable loop should be understandable without requiring a large tutorial:

1. **Enter the world.** A new player creates an account and joins the shared world.
2. **Establish a settlement.** The player receives one starting settlement at a valid location.
3. **Manage resources.** The settlement produces and stores basic materials.
4. **Choose a development path.** The player spends resources to construct or upgrade buildings.
5. **Let time pass.** Production and construction continue while the player is away.
6. **Return and respond.** The player collects the results, reviews the settlement, and chooses the next action.
7. **Observe the world.** The player can inspect the map and a history of notable events.

The MVP must make this loop satisfying and reliable before adding warfare, complex politics, or a large trading system.

## The persistent-world principle

The world is shared and persistent. A browser session is only a way to view and interact with it.

The game must not depend on:
- A player keeping a browser tab open.
- A player staying connected to a WebSocket.
- A single worker process remaining alive continuously.
- A timer running in the player's computer.
- The client reporting that a construction job or production cycle has finished.

Instead, the server stores the state and the timestamps needed to determine what should have happened.

When a player returns, the server calculates the progress due since the last recorded settlement of that game state. A background worker also processes due work so the world can record completions and publish notifications. Both paths must use the same rules and be safe to retry.

**The world does not need a process executing every settlement every second to remain persistent.** It needs durable state, trustworthy timestamps, and correct elapsed-time calculations.

## Game systems

### World map and isometric presentation

The MVP world is a finite, seeded map made from logical grid coordinates. The first terrain palette is:

| Terrain | Initial gameplay meaning |
|---|---|
| Plains | General settlement-friendly land |
| Forest | Woodland; potential source of wood |
| Hills | Rocky terrain; potential stone or iron sites |
| Water | Rivers, lakes, or impassable water |

The initial map should include settlement locations and terrain information. Terrain can influence future resource access and expansion rules, but the first release should avoid an overly complicated map simulation.

#### Isometric coordinates

The server stores logical tile coordinates such as `(x, y)`. It does not store screen pixels.

For a conventional diamond isometric grid with tile width `W` and tile height `H`, a renderer can project a logical tile to screen coordinates:

```text
screenX = (x - y) * W / 2
screenY = (x + y) * H / 2
```

The frontend owns camera position, zoom, pointer interaction, selection, and visual effects. The backend owns the actual terrain, settlement location, and game state.

MVP map interactions:
- Pan and zoom.
- Display terrain tiles.
- Display settlement markers.
- Select a tile or settlement.
- Open a settlement information panel.
- Load map data from the API, not from hardcoded client-side game state.

### Settlements

A settlement is the player's primary base of development.

An MVP settlement contains:
- An owner.
- A world and map location.
- An inventory of resources.
- A collection of buildings and their levels.
- Storage limits.
- Construction jobs.
- A timestamp recording when production was last settled.

For the MVP, each player receives one starting settlement in the world. The database must enforce this rule; it must not rely only on frontend checks.

Future versions may introduce multiple settlements, colonies, outposts, and settlement specialization.

### Resources and economy

The MVP begins with four core resources.

| Resource | Role in the MVP |
|---|---|
| Wood | Basic construction material |
| Stone | Building construction and upgrades |
| Food | Basic upkeep and a foundation for future population mechanics |
| Iron | Advanced construction material and a foundation for future military systems |

Resources are represented as integer quantities. The game should not use floating-point numbers for inventory balances.

Each settlement has an inventory and storage capacity. Buildings contribute to resource production. Construction consumes resources. The exact rates, costs, caps, and balance values are game-design configuration—not values that frontend components may decide independently.

#### Production model

A building has a server-defined production rate. Production is calculated from elapsed time since the settlement was last processed.

Conceptually:

```text
elapsed = current_server_time - last_settled_time
produced = production_rate_per_hour * elapsed_in_seconds / 3600
new_balance = min(storage_capacity, old_balance + produced)
```

This is a conceptual model, not a final balance sheet. The implementation must define integer rounding and preserve fractional production remainder where needed, so frequent small updates do not silently lose production.

Production rules must account for:
- Building type and level.
- Production rate.
- Elapsed time.
- Storage capacity.
- Any applicable consumption or upkeep rules.
- World configuration and future modifiers.

All values and elapsed time are determined by the server.

#### Player-driven economy — future direction

A later economy may allow players to exchange resources, establish trade routes, specialize settlements, and respond to supply and demand. Prices should emerge from actual game activity if a player-driven market is introduced.

A fully dynamic market is not required for the MVP.

### Buildings and construction

Buildings give settlements their economic and strategic identity.

Initial building concepts:

| Building | Initial purpose |
|---|---|
| Town Hall | Settlement center and progression anchor |
| Lumber Mill | Produces wood |
| Quarry | Produces stone |
| Farm | Produces food |
| Iron Mine | Produces iron when the map/site rules allow it |

The first playable slice may launch with the Town Hall, Lumber Mill, Quarry, and Farm. The Iron Mine can follow once resource-site rules are ready.

Each building has:
- A building type.
- A level.
- A settlement.
- A construction or upgrade cost.
- A construction duration.
- A server-defined effect, such as production or storage.

Starting a construction job must be an atomic server operation:
1. Verify that the player owns the settlement.
2. Verify that the building and requested upgrade are valid.
3. Verify prerequisites and available resources.
4. Deduct the cost.
5. Create a job with server-generated start and completion timestamps.
6. Commit all changes together.

A construction job is due when server time reaches its stored completion time. A delayed worker must not delay the actual game rule; it may delay when the completion is materialized or announced, but the job's completion is determined by its timestamp.

### Time, simulation, and game physics

AFTERHOURS is a strategy and economy simulation, not a real-time action game. Its primary "physics" are deterministic rules governing time, production, construction, capacity, ownership, and state changes.

There is no requirement for a rigid-body physics engine in the MVP. The important physics are the rules that make the world behave consistently.

#### 1. Authoritative time

- The server clock is the authority.
- Store timestamps in UTC.
- Never trust the player's device clock.
- Store start and due timestamps for timed actions.
- Calculate elapsed time from persisted timestamps.
- Handle clock and rounding decisions consistently across the API and worker.

#### 2. Offline production

If a settlement was last processed at time `T0` and is next processed at `T1`, the simulation calculates the production due over that interval.

The calculation must happen transactionally:
1. Lock or safely claim the settlement state.
2. Read its inventory, active buildings, and previous settlement timestamp.
3. Calculate elapsed production using shared game rules.
4. Apply consumption and storage caps.
5. Update inventory and the settlement timestamp in the same transaction.
6. Commit.
7. Publish notifications after the durable state change.

If a player returns after a long absence, the server calculates the eligible progress since the last settlement. Storage caps prevent unlimited resource accumulation. Any future offline-progress limits must be explicit game-design rules, not accidental server behavior.

#### 3. Construction time

Construction jobs store `started_at` and `completes_at`. The server determines whether a job is due.

A worker may poll for due jobs and materialize completion. If the worker is offline and restarts later, it must still complete jobs whose timestamps have passed. It must never complete a job twice.

#### 4. Simulation worker

The simulation worker is a background process that:
- Finds settlements that need production settlement.
- Finds construction jobs whose completion time has passed.
- Applies shared domain rules.
- Records important world events.
- Retries safely after recoverable failures.

The initial implementation can use scheduled database polling. Redis, distributed queues, and complex orchestration are not prerequisites for the MVP.

#### 5. Determinism and idempotency

The same state and elapsed interval should produce the same result. Reprocessing the same job or command must not duplicate rewards, costs, or events.

Important operations need database transactions, stable identifiers, unique constraints, and safe status transitions. A process crash must not leave a player charged without a job, or a job completed without the building update.

#### 6. Simulation boundaries

The MVP simulation covers:
- Resource production.
- Resource storage caps.
- Resource spending.
- Construction and upgrades.
- Offline progression.
- Settlement and world event records.

Combat calculations, troop movement, weather, population simulation, disease, and other advanced world systems are future design areas. They should not be implied by the initial release.

### Ownership and multiplayer

AFTERHOURS is asynchronous multiplayer. Players share a world, but they do not need to be online at the same time to make progress.

MVP ownership rules:
- Each settlement has one owner.
- Only the owner may issue private settlement commands.
- The server validates ownership for every state-changing request.
- The browser cannot change ownership, resource balances, building levels, or construction outcomes.
- Public map information and private settlement information must have clearly defined visibility rules.

Factions, alliances, diplomacy, territorial conflict, and warfare are planned future systems. They are not part of the initial playable loop.

### World history and events

The world should have a record of meaningful changes.

Initial event types may include:
- Player joined the world.
- Settlement established.
- Construction started.
- Building completed or upgraded.
- Significant resource or production milestone reached.

Events should be stored persistently and displayed in a basic activity feed. Events caused by a transaction should be written consistently with that transaction where possible. Retried simulation work must not create duplicate event records.

Future versions may turn the history into a richer chronicle of alliances, wars, trade, territorial changes, and player decisions.

## MVP scope

The MVP is a deliberately limited first playable version. It proves that a shared world, a settlement, and offline progression work correctly.

### Included

- One finite persistent world.
- Dark-fantasy visual identity.
- Isometric map with pan and zoom.
- Account registration, login, and player profile.
- One starting settlement per player.
- Wood, stone, food, and iron resource model.
- A small initial building catalog.
- Resource production and storage caps.
- Timed construction and upgrades.
- Offline progression that survives process restarts.
- Basic settlement details and activity history.
- Server-side validation and ownership checks.

### Not included in the MVP

- Player-versus-player combat.
- Armies, raids, and sieges.
- Advanced diplomacy and treaties.
- Player-created kingdoms or faction hierarchies.
- A complete player-driven marketplace.
- Real-time synchronous battles.
- Multiple worlds or shards.
- Large-scale territorial warfare.
- A mobile-native application.

These are future possibilities. They should not become hidden requirements that delay the first playable version.

### MVP acceptance criteria

The MVP can be considered playable when:

1. A new user can register, log in, and enter the world.
2. The user receives exactly one starting settlement in that world.
3. The isometric map loads terrain and settlement markers from API data.
4. The player can view resource balances and building levels.
5. The player can start valid construction; invalid or unaffordable commands are rejected server-side.
6. Production and construction progress while the player is offline.
7. API and worker restarts do not lose or duplicate progress.
8. A player cannot spend another player's resources or modify another player's settlement.
9. Important actions appear in a basic activity history.
10. Core game rules have automated unit and integration tests.

## Future possibilities

The following ideas are intentionally outside the MVP, but help explain the long-term direction:

- **Factions and kingdoms:** players organize into political groups.
- **Diplomacy:** alliances, treaties, negotiations, and betrayals.
- **Territorial control:** ownership and influence over strategic map regions.
- **Military systems:** armies, raids, sieges, and server-resolved battles.
- **Trade:** player-to-player exchange, markets, routes, and supply/demand.
- **Population:** settlement inhabitants, needs, happiness, and labor.
- **World events:** seasonal changes, disasters, discoveries, and other systemic events.
- **Chronicle:** a searchable history of the world's major events.

Each future system must respect the same principles: server-authoritative state, persistent records, clear rules, and safe offline progression.

## Technology stack

The stack below is the proposed MVP baseline. It is a set of engineering choices, not a claim that the entire system has already been implemented.

| Layer | Technology | Responsibility |
|---|---|---|
| Web application | Next.js | Browser application, routing, pages |
| Language | TypeScript | Shared type safety |
| Styling | Tailwind CSS | UI styling and layout |
| Isometric renderer | PixiJS | 2D rendering, map camera, interaction |
| Backend runtime | Node.js | Server-side application runtime |
| API framework | Fastify | HTTP API and WebSocket gateway |
| Database | PostgreSQL | Persistent authoritative game state |
| ORM and migrations | Prisma | Database access and schema evolution |
| Live updates | WebSockets | Notifications and state-change messages |
| Simulation | Node.js worker | Offline production and due construction processing |
| Monorepo | pnpm workspaces | Shared packages and coordinated dependencies |
| Testing | Vitest / integration tooling | Domain, API, and simulation tests |
| Local infrastructure | Docker Compose | Local PostgreSQL and development dependencies |
| Web hosting | Vercel or equivalent | Frontend deployment |
| API/worker hosting | Long-running Node.js hosting | API, WebSocket, and simulation processes |

### Why this stack?

- Next.js and TypeScript provide a maintainable browser application.
- PixiJS is suited to rendering a large interactive 2D/isometric map without treating the map as a collection of ordinary DOM elements.
- Fastify provides a lightweight API foundation.
- PostgreSQL gives durable transactions and relational constraints for game state.
- Prisma provides schema and migration tooling.
- A separate worker keeps scheduled world progression independent from browser sessions and API request handling.
- A monorepo allows the frontend, API, and simulation to share contracts and game rules.

Redis, Kubernetes, and microservices are deliberately deferred until actual scale or operational requirements justify them.

## Technical architecture

### High-level structure

```text
                         PLAYER
                           |
                        Browser
                           |
               Next.js + TypeScript UI
                    PixiJS world map
                           |
                   HTTPS / WebSocket
                           |
                    Fastify API
                    /          \
           Authentication    Game commands
                    \          /
                     Domain rules
                           |
                        Prisma
                           |
                      PostgreSQL
                           ^
                           |
                Simulation worker
              production + construction
```

### Architectural responsibilities

**Web client**
- Displays the world map and game interface.
- Requests canonical state from the API.
- Sends player commands.
- Displays notifications and activity history.
- Never decides authoritative game outcomes.

**API**
- Authenticates players.
- Validates requests and permissions.
- Executes gameplay commands.
- Reads and writes persistent state.
- Publishes notifications after successful state changes.

**Game domain package**
- Contains reusable game rules and calculations.
- Defines production, costs, storage caps, upgrade requirements, and other mechanics.
- Should favor pure functions that can be tested independently of HTTP and database code.

**Simulation worker**
- Processes elapsed production and due construction.
- Uses the same domain rules as the API.
- Handles retries and process restarts safely.
- Does not require players to remain connected.

**PostgreSQL**
- Stores accounts, worlds, tiles, settlements, inventories, buildings, construction jobs, and events.
- Enforces relationships and important uniqueness rules.
- Acts as the canonical source of game state.

**WebSockets**
- Notify connected clients about changes.
- Do not replace database persistence.
- On reconnect, clients fetch current state from the API rather than trusting missed in-memory messages.

### Planned monorepo layout

```text
before-hours/
├── apps/
│   ├── web/                  # Next.js browser application
│   ├── api/                  # Fastify API and WebSocket gateway
│   └── simulation/           # Persistent-world worker
│
├── packages/
│   ├── contracts/            # Shared request/response schemas
│   ├── game-domain/          # Game rules and calculations
│   ├── database/             # Prisma schema and migrations
│   └── config/               # Shared tooling configuration
│
├── .github/                  # Contribution and PR templates
├── README.md
└── package.json
```

This is the intended structure, not a statement that all directories currently exist.

## Data and domain model

The initial data model is expected to contain the following concepts:

| Entity | Purpose |
|---|---|
| User | Login identity, credentials, account status |
| Player | Public identity and player-level settings |
| World | World configuration and simulation metadata |
| Tile | Logical coordinates, terrain, map metadata |
| Settlement | Owner, location, name, storage and production state |
| Inventory | Integer resource balances |
| Building | Building type, level, settlement |
| ConstructionJob | Start time, completion time, status, target |
| WorldEvent | Persistent record of notable events |

Important data rules:
- Use stable IDs and database foreign keys.
- Enforce one starting settlement per player per world.
- Store resource balances as integers.
- Store timestamps in UTC.
- Keep resource changes transactional.
- Use indexes for frequently queried world, settlement, owner, and due-job fields.
- Use unique constraints and safe status transitions to prevent duplicate processing.

## Security and game integrity

The server must be authoritative because the browser is controlled by the player.

- Passwords must be securely hashed, for example with Argon2id.
- Browser sessions should use secure, HttpOnly, SameSite cookies.
- Authentication and sensitive endpoints should be rate-limited.
- Every state-changing command must validate the player's identity and ownership.
- Client-supplied balances, costs, production rates, completion times, and ownership changes must never be trusted.
- Resource spending and construction creation must happen in a database transaction.
- Worker operations must be retry-safe.
- Secrets and database credentials must never be exposed in the frontend bundle.
- Important administrative and economy-changing actions should be auditable.

## Development principles

1. **Agree on contracts before parallel implementation.** Shared API shapes, database fields, and domain rules must be discussed before multiple contributors depend on them.
2. **Keep the first version small.** A reliable settlement loop is more valuable than unfinished versions of ten advanced systems.
3. **Separate presentation from simulation.** The map renderer must not contain authoritative gameplay rules.
4. **Test game rules.** Production, construction, storage, ownership, and offline progression need automated tests.
5. **Prefer simple infrastructure.** Do not introduce distributed systems before the MVP needs them.
6. **Document decisions.** Significant changes to the stack, rules, or scope should be discussed and recorded.
7. **Protect the main branch.** All contributions arrive through pull requests and maintainer review.

## Team roles and phase-by-phase ownership

The team is intentionally small, so responsibilities are clear but collaboration is expected. A role identifies the person accountable for driving a workstream; it does not mean that person works in isolation or owns every file in that area.

### Core team

| Member | Role | Primary responsibility |
|---|---|---|
| **Raghav** | Maintainer / Project lead | Owns product direction, scope, priorities, acceptance criteria, architecture decisions, issue creation, review coordination, and merges to `main`. Keeps contributors unblocked and prevents scope creep. |
| **Chirrayu** | Backend | Owns the API, authentication, database integration, persistence, server-side validation, API contracts, and backend deployment. Coordinates closely with Manan on game-domain rules. |
| **Mohit** | Frontend | Owns the web application structure, page layouts, navigation, visual system, game HUD, and player-facing interface. Coordinates map integration with Manan. |
| **Saransh** | Testing and frontend | Owns the test strategy, automated test coverage, integration and end-to-end validation, regression checks, and frontend contributions—especially UI states, interaction flows, and accessibility/usability checks. |
| **Manan** | Game engine | Owns the game-domain model and simulation rules: map/tile logic, resource production, construction timing, progression calculations, deterministic behavior, and simulation-worker logic in coordination with Chirrayu. |

**Decision boundary:** Raghav is the final maintainer for scope and merge decisions. Chirrayu owns backend implementation decisions within the agreed architecture. Mohit owns frontend implementation decisions within the agreed UI and product direction. Saransh can request changes when behavior is untested or regressions are found. Manan owns the correctness of game-rule calculations. Cross-cutting decisions are discussed before implementation.

### Phase 0 — Product lock and implementation contracts

**Goal:** Remove ambiguity before parallel coding begins.

- **Raghav:** Approve the MVP boundaries, prioritize the first playable loop, turn accepted requirements into issues with acceptance criteria, and resolve product questions.
- **Chirrayu:** Propose the initial API boundaries, persistence responsibilities, authentication approach, and database constraints.
- **Mohit:** Define the first-screen and settlement-screen user flows; identify the frontend data each screen needs.
- **Saransh:** Write the test plan for the first playable loop; identify critical edge cases and the minimum CI checks.
- **Manan:** Specify the first version of map, resource, production, storage, and construction rules in implementation-ready terms.

**Meaningful PR opportunities (only after the decisions are agreed):**
1. Product specification and accepted MVP rules (documentation).
2. API and data-contract specification (documentation/types, if useful to unblock parallel work).
3. Game-rules specification and balance configuration (documentation/configuration).

Do not create separate PRs for meeting notes, tiny wording changes, or decisions that belong together. If one agreed specification is clearer as one reviewable change, keep it in one PR.

### Phase 1 — Repository and technical foundation

**Goal:** A clean project that every contributor can run and test locally.

- **Raghav:** Confirm the stack and repository conventions; review the setup PRs and keep the initial scope lean.
- **Chirrayu:** Establish the workspace/backend foundation, environment configuration, database connection, initial migrations, and API health endpoint.
- **Mohit:** Establish the Next.js application shell, shared styling baseline, navigation/layout, and a responsive application frame.
- **Saransh:** Establish test tooling and CI checks; add smoke tests for the web app and API startup; document the local verification steps.
- **Manan:** Establish the game-domain package boundary and a small set of pure, testable rule interfaces; avoid implementing unapproved mechanics.

**Potential PRs:**
1. Monorepo/workspace and shared tooling setup — Chirrayu, with Saransh validating CI.
2. Web application shell and base layout — Mohit.
3. API service bootstrap and health endpoint — Chirrayu.
4. Database connection, initial schema baseline, and migration workflow — Chirrayu.
5. Game-domain package skeleton and rule conventions — Manan.
6. CI pipeline and smoke-test baseline — Saransh.

These are separate only if each can be reviewed and verified independently. If the workspace setup and CI are inseparable in the chosen tooling, combine them rather than manufacturing a PR.

### Phase 2 — World data and isometric map

**Goal:** Players can enter a real seeded world and inspect it.

- **Raghav:** Approve the initial world size, terrain palette, map readability, and acceptance criteria.
- **Chirrayu:** Store world/tile data, seed the initial map, and expose read-only world/map endpoints.
- **Mohit:** Build the PixiJS map surface, camera pan/zoom, tile rendering, loading/error states, and responsive map layout.
- **Saransh:** Test map API responses, coordinate edge cases, loading states, and user interactions; add regression coverage.
- **Manan:** Define logical grid coordinates, terrain identifiers, map validation, and deterministic map-generation/seed rules.

**Potential PRs:**
1. World and tile schema plus initial seed data — Chirrayu.
2. Logical map and terrain domain rules — Manan.
3. Read-only world/map API — Chirrayu.
4. Isometric renderer and camera controls — Mohit.
5. Terrain styling and tile selection/inspection — Mohit.
6. Map/API integration and map regression tests — Saransh, pairing with the relevant owners.

### Phase 3 — Accounts and first settlement

**Goal:** A player can enter the world and see their own settlement.

- **Raghav:** Approve onboarding behavior and the one-starting-settlement rule; verify the player journey against the MVP.
- **Chirrayu:** Implement registration/login, session handling, player profile persistence, starting-settlement creation, and ownership-protected settlement endpoints.
- **Mohit:** Build registration/login screens, onboarding flow, settlement dashboard, resource summary, and building overview components.
- **Saransh:** Test authentication flows, duplicate account handling, session behavior, settlement creation, and cross-player access denial; contribute frontend loading, empty, and error states.
- **Manan:** Define starting settlement defaults, valid placement constraints, and the initial building/resource state as domain configuration.

**Potential PRs:**
1. Account and session API — Chirrayu.
2. Authentication and onboarding UI — Mohit.
3. Starting settlement domain rules/defaults — Manan.
4. Starting settlement creation and ownership API — Chirrayu.
5. Settlement dashboard and inventory/building display — Mohit.
6. Authentication and ownership integration tests — Saransh.

### Phase 4 — Economy and construction

**Goal:** The settlement loop becomes playable: production, spending, building, and upgrading.

- **Raghav:** Approve costs, production rates, storage caps, prerequisites, and construction durations before they are implemented; prioritize balance changes.
- **Chirrayu:** Implement transactional commands and persistence for inventory changes, construction requests, and upgrades; enforce ownership and affordability on the server.
- **Mohit:** Build resource panels, building catalog/cards, construction forms, timers/status displays, and clear success/error feedback.
- **Saransh:** Add unit and integration tests for affordability, caps, invalid commands, duplicate submissions, and unauthorized actions; test the full UI command flow.
- **Manan:** Implement pure production, capacity, cost, prerequisite, upgrade, and elapsed-time calculations; provide deterministic test cases and versioned balance configuration.

**Potential PRs:**
1. Building/resource definitions and approved balance configuration — Manan.
2. Production and storage-cap calculations — Manan.
3. Inventory and production API integration — Chirrayu.
4. Building catalog and upgrade rules — Manan.
5. Transactional construction/upgrade commands — Chirrayu.
6. Building and construction UI — Mohit.
7. Economy and construction unit/integration test suite — Saransh.

Keep the game-rule calculation PR separate from database/API wiring when the domain rules can be tested independently. Do not split one atomic transaction across artificial PRs.

### Phase 5 — Persistent offline simulation

**Goal:** The world progresses correctly while players are away, including across process restarts.

- **Raghav:** Approve offline progression expectations and any cap/limit rules; decide what must be visible to players when they return.
- **Chirrayu:** Implement worker process setup, due-work claiming, transactional persistence, database locking/coordination, and operational logging.
- **Mohit:** Show production progress, construction completion state, return-after-absence summaries, and reconnect/refetch behavior.
- **Saransh:** Test elapsed-time scenarios, worker restarts, repeated processing, concurrent requests, storage caps, and failure recovery.
- **Manan:** Implement shared deterministic simulation calculations, fractional production handling, construction due-state rules, and idempotent simulation behavior.

**Potential PRs:**
1. Offline production calculation and deterministic time tests — Manan.
2. Simulation worker bootstrap and due-work polling — Chirrayu.
3. Transaction-safe production settlement — Chirrayu, using Manan's rules.
4. Due construction completion processing — Manan and Chirrayu, preferably as one coherent vertical slice if the domain and persistence changes cannot be independently validated.
5. Idempotency/concurrency/restart regression tests — Saransh.
6. Offline progress and completion UI states — Mohit.

A worker that merely starts but does not safely persist progress is not a complete feature. The acceptance test must prove that elapsed time is applied once, even after a restart or retry.

### Phase 6 — World history, integration, and MVP release

**Goal:** Make the first playable loop understandable, testable, and safe to invite players into.

- **Raghav:** Run the release checklist, accept/reject MVP scope, coordinate final reviews, prioritize blockers, and approve the release.
- **Chirrayu:** Complete event persistence/API support, security hardening, error handling, deployment configuration, and database backup/recovery notes.
- **Mohit:** Complete activity feed, world/settlement navigation, responsive polish, accessibility basics, and consistent empty/loading/error states.
- **Saransh:** Own end-to-end regression of the acceptance criteria, browser compatibility checks, test report, and release-blocker verification.
- **Manan:** Validate simulation consistency across long elapsed intervals, edge cases, and balance configuration; fix domain-rule defects found during acceptance testing.

**Potential PRs:**
1. Persistent world-event model and event API — Chirrayu.
2. Activity feed and event presentation — Mohit.
3. Security/authorization regression coverage — Saransh.
4. Full player-loop end-to-end tests — Saransh.
5. Simulation edge-case and balance fixes — Manan.
6. Deployment, operations, and recovery documentation/configuration — Chirrayu.
7. Final usability/accessibility fixes — Mohit.
8. Release checklist and MVP documentation update — Raghav.

Do not create a separate PR for every test case or every CSS adjustment. Group related coverage and polish into cohesive changes that have a clear review purpose.

### Cross-phase working agreements

- One person is the **primary author** for each PR; collaborators can review or contribute, but ownership must be clear.
- Backend and game-engine work must agree on domain contracts before either side depends on an unstable interface.
- Frontend work should use agreed API contracts and mock data only where that unblocks a genuinely independent UI task.
- Saransh should be involved early, not only at the end; tests should accompany the feature they validate.
- Raghav creates or approves the issue before implementation begins and keeps the acceptance criteria stable during the work.
- A PR is not a task tracker. One issue may produce multiple PRs when it contains independently reviewable deliverables; one PR may close multiple tightly related issues when the change is cohesive.
- Prefer vertical slices that can be demonstrated and tested over large "finish the whole phase" PRs.

## Pull request strategy

The goal is to maximize **useful, reviewable PRs**, not the raw PR count. A healthy project can produce many PRs because the work naturally separates into API, domain, UI, and test deliverables. It should never produce PRs whose only purpose is to increase contribution counts.

### When work deserves its own PR

Create a separate PR when the change:
- Delivers one independently understandable capability or foundation.
- Has a clear issue, owner, and acceptance criteria.
- Can be reviewed without requiring unrelated unfinished work.
- Has meaningful verification: tests, a working UI flow, a migration check, a reproducible setup step, or a documented decision.
- Is small enough to understand but large enough to matter.

### When to combine work

Combine changes when they:
- Must land atomically to keep the application working.
- Are two halves of one inseparable feature.
- Are trivial edits that would create review overhead without adding clarity.
- Depend on the same small implementation and cannot be meaningfully validated separately.

### Suggested PR sizing and cadence

- Aim for one coherent outcome per PR; as a rough guide, prefer a few hundred lines over a thousand-line feature dump, but do not split code mechanically by line count.
- Prefer several focused PRs across a phase rather than one phase-sized PR.
- Open draft PRs when early integration feedback is useful, not merely to reserve a number.
- Keep PRs targeted at `main`; avoid long-lived branches that accumulate unrelated changes.
- Merge only after review, checks, and relevant acceptance criteria pass.
- Use squash-and-merge unless the maintainer has a reason to preserve individual commits.

### Definition of a legitimate PR

Before opening a PR, the contributor should be able to answer:
1. What user-visible or engineering outcome does this deliver?
2. Which issue or approved phase requirement does it satisfy?
3. How can a reviewer verify it?
4. What does it depend on, and is that dependency already merged or clearly documented?

If those answers are unclear, the work probably needs a better issue or should be combined with a related change. Never create empty PRs, cosmetic-only contribution-count PRs, duplicate PRs, or PRs that merely move code between files without a real engineering reason.

## Roadmap

### Phase 0 — Product and architecture foundation
- [x] Establish dark-fantasy, isometric, asynchronous MVP direction.
- [x] Define initial product scope and technical baseline.
- [x] Document persistence and simulation principles.
- [ ] Review and approve the foundation documentation PR.

### Phase 1 — Project foundation
- [ ] Establish the monorepo and workspace tooling.
- [ ] Configure local development and PostgreSQL.
- [ ] Establish shared contracts, configuration, and test tooling.
- [ ] Create the initial database schema and seeded world.

### Phase 2 — First playable settlement
- [ ] Implement registration, login, and onboarding.
- [ ] Create a starting settlement.
- [ ] Expose world map and settlement data through the API.
- [ ] Render the first isometric map.
- [ ] Display inventory and building information.

### Phase 3 — Economy and construction
- [ ] Implement resource production and storage caps.
- [ ] Implement building definitions and construction costs.
- [ ] Implement timed construction and upgrades.
- [ ] Add server-authoritative command validation.

### Phase 4 — Persistent world
- [ ] Implement restart-safe offline progression.
- [ ] Implement worker retries and duplicate protection.
- [ ] Add construction completion and activity events.
- [ ] Verify that progress survives browser, API, and worker restarts.

### Phase 5 — MVP validation
- [ ] Test the complete player loop.
- [ ] Test ownership and economy integrity.
- [ ] Test offline progression with simulated elapsed time.
- [ ] Test deployment and recovery.
- [ ] Review performance and usability before inviting more players.

### Later — Beyond MVP
Faction systems, diplomacy, trade, territory, population, military systems, and large-scale world simulation are considered only after the core MVP is stable.

## Repository and contribution workflow

**Before Hours** is the repository/project name. **AFTERHOURS** is the game being designed and built here.

The project has a maintainer-led workflow:
- The maintainer owns project direction, scope, architecture decisions, review, and merging.
- Contributors take agreed issues and work on focused branches.
- Every contribution is submitted as a pull request targeting `main`.
- The maintainer reviews and decides when a PR is ready to merge.
- Contributors should coordinate changes to shared contracts, database schema, and game rules before implementation.

### Branch naming

Use focused branch names:

```text
feat/settlement-inventory
feat/isometric-map
fix/construction-validation
docs/game-design
test/offline-production
chore/monorepo-setup
```

### Pull request expectations

Every PR should:
- Explain what changed and why.
- Link the relevant issue where applicable.
- Include tests or explain why tests are not applicable.
- Include screenshots for visual changes.
- Mention API, schema, configuration, or migration changes.
- Be focused and reasonably reviewable.

Do not push directly to `main`. The intended merge strategy is squash-and-merge after maintainer approval and resolution of review conversations.

The contribution workflow above is the project-wide baseline; the pull request template in `.github/PULL_REQUEST_TEMPLATE.md` helps contributors submit consistent reviews.

## Glossary

| Term | Meaning |
|---|---|
| Persistent world | A world whose state continues independently of a player's session |
| Asynchronous multiplayer | Players interact with the same world without needing to be online simultaneously |
| Settlement | A player's base of development |
| Inventory | The resources stored by a settlement |
| Production | Resources generated by buildings over elapsed time |
| Storage cap | The maximum amount of a resource a settlement can hold |
| Construction job | A timed building creation or upgrade operation |
| Simulation worker | A background process that materializes due world progression |
| World event | A persistent record of a notable action or change |
| Server-authoritative | The server validates and determines the official game state |
| Idempotent operation | An operation that can safely be retried without duplicating its effect |
| Isometric map | A 2D rendering technique that gives a 3D-like angled view of a grid |

## Project status

**Current stage: concept and foundation documentation.**

The technology stack and systems described here are the proposed MVP plan. They should not be interpreted as already implemented features. The immediate objective is to agree on the product and technical foundation before implementation work is divided among contributors.

The first milestone is not a massive kingdom simulator. It is one small world, one working settlement loop, and a simulation that reliably remembers what happened while everyone was away.

---

*AFTERHOURS — The world doesn't wait for you.*

*Built under the Before Hours project.*
