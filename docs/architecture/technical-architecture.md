# AFTERHOURS — Technical Architecture

**Status:** Proposed MVP architecture  
**Direction:** Dark fantasy · Isometric · Asynchronous · Persistent world

## Principles

1. **Server-authoritative:** every gameplay command is validated by the server.
2. **Persistent:** progress derives from stored timestamps, not an open browser tab or an always-running process.
3. **Idempotent:** retries and worker restarts must not duplicate resources or rewards.
4. **Modular monolith first:** API and simulation are separate processes, share typed domain packages, and use PostgreSQL. Avoid premature microservices.
5. **Explicit contracts:** web, API, and simulation share schemas and domain types.
6. **Playable loop first:** reliable settlement and economy before combat or scale.

## System overview

```text
Browser: Next.js + TypeScript + PixiJS
                |
          HTTPS / WebSocket
                |
         Fastify API server
          /             \
     Domain services   Prisma
          \             /
             PostgreSQL
                  |
       Node.js simulation worker
       (scheduled, restart-safe)
```

- **Web client:** renders map/UI, submits commands, displays server state.
- **API:** authenticates, validates, authorizes, executes commands, publishes updates.
- **Simulation worker:** settles elapsed production and completes due construction jobs.
- **PostgreSQL:** canonical state for accounts, worlds, tiles, settlements, inventories, buildings, jobs, and events.
- **WebSockets:** deliver notifications, not authoritative state.
- **Redis:** deferred until measured workload justifies it.

## Monorepo layout

```text
apps/
  web/                 # Next.js app and PixiJS map
  api/                 # Fastify HTTP and WebSocket gateway
  simulation/          # Background progression worker
packages/
  contracts/           # Shared request/response schemas and event types
  game-domain/         # Pure game rules and calculations
  database/            # Prisma schema, migrations, seed scripts
  config/              # Shared TypeScript, lint and runtime config
docs/
  architecture/
  game-design/
```

Use pnpm workspaces and TypeScript. Keep game calculations in pure functions where practical so they can be tested without a database.

## Core domain model

Initial entities:

- **User:** credentials, account status, timestamps.
- **Player:** public display name and player settings.
- **World:** identifier, configuration, simulation watermark.
- **Tile:** integer map coordinates, terrain type, optional resource/site metadata.
- **Settlement:** owner, world, map position, name, storage limits.
- **Inventory:** integer resource balances for a settlement.
- **Building:** type, level, settlement, production configuration.
- **ConstructionJob:** target building/level, start time, completion time, status.
- **WorldEvent:** append-only record of notable player and simulation events.

Use stable IDs and foreign keys. Enforce one starting settlement per player per world in the database. Store resource balances as integers in the smallest game unit; avoid floating-point inventory arithmetic.

## Asynchronous world progression

The world progresses while players are offline, including across API or worker restarts.

### Production settlement

Persist a watermark such as `last_settled_at`. When a settlement is accessed or processed:

1. Begin a database transaction and lock the relevant settlement/inventory rows.
2. Calculate elapsed time from the persisted watermark to current server time.
3. Calculate production using server-defined rates and active building levels.
4. Apply storage caps and consumption rules.
5. Advance the watermark in the same transaction.
6. Commit, then publish a state update.

Never accept elapsed time, production rates, balances, or completion status from the browser. Use UTC timestamps and integer arithmetic with explicit rounding rules.

### Construction

A job stores `started_at`, `completes_at`, and status. It is complete when server time reaches `completes_at`; a worker may materialize completion, but correctness must not depend on the worker running at the exact second. Completion and building-level changes must be atomic and idempotent.

### Worker safety

- Start with a small scheduled polling loop; no Redis queue is required.
- Claim due jobs safely using row locks / `FOR UPDATE SKIP LOCKED` or equivalent transactional claims.
- Use unique constraints and status transitions to prevent duplicate completion.
- Make processing safe to retry after a crash.
- Record failures with enough context to retry or investigate.
- Never hold a database transaction open during network I/O.

## API boundaries

Initial HTTP areas:

- `/auth` — register, login, logout, current session.
- `/worlds` — list and enter available worlds.
- `/map` — retrieve visible map tiles and settlement markers.
- `/settlements` — view player settlement and inventory.
- `/buildings` — list building types and start upgrades.
- `/events` — retrieve recent world/player history.

Gameplay commands are validated server-side using schemas from `packages/contracts`. Use idempotency keys for commands that may be retried, persisting the command identifier/result.

WebSocket notifications may include `settlement.updated`, `construction.completed`, and `world.event.created`. On reconnect, clients fetch canonical state over HTTP; do not rely on an unbounded in-memory socket buffer.

## Isometric map

Use PixiJS to render map data delivered as logical grid coordinates and terrain identifiers. Keep rendering coordinates separate from game coordinates. The server stores logical coordinates only; the client handles camera movement, zoom, selection, hover, and visual effects.

MVP requirements: finite seeded map; plains/forest/hills/water terrain; settlement markers; selected tile/settlement details; pan and zoom. The map is a view of server-owned state, not authority over ownership.

## Security and integrity

- Hash passwords with Argon2id or an established secure password-hashing library.
- Use secure, HttpOnly, SameSite cookies for browser sessions.
- Validate and authorize every command on the API.
- Rate-limit authentication and sensitive endpoints.
- Never expose secrets or database credentials to the web bundle.
- Treat client-supplied IDs as untrusted and verify ownership.
- Keep resource spending and construction completion transactional.
- Log administrative and economically significant actions.

## Testing

- Unit tests: production formulas, storage caps, costs, upgrade durations, coordinate projection.
- Integration tests: transactions, ownership checks, idempotency, worker retries.
- API tests: authentication and invalid commands.
- Simulation tests: fake-clock offline progress and restart recovery.
- End-to-end slice: register → enter world → receive settlement → start construction → advance time → observe completion.

## Deployment

Deploy web, API, and simulation worker as separate processes. They share versioned contracts and PostgreSQL. Run migrations as a controlled release step, not independently from every app replica.

Local development should provide Docker Compose for PostgreSQL and one command to run workspace apps. Production hosting must support a long-running API/WebSocket process and a long-running worker; a serverless frontend host alone is insufficient.

## Deferred

Redis, Kubernetes, microservices, real-time combat, large-scale market matching, multiple worlds, advanced diplomacy, and horizontal simulation sharding are outside MVP. Revisit only when product requirements and measurements demand them.
