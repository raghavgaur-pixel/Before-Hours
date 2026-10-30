# AFTERHOURS — MVP Game Design

## High concept

AFTERHOURS is a browser-based, asynchronous multiplayer dark-fantasy civilization simulator. Players establish settlements in one shared world, develop their local economy, and return later to see what time has changed.

**Promise:** the world does not stop when a player logs off.

## Locked direction

- Setting: dark fantasy.
- Presentation: isometric 2.5D map.
- Multiplayer: asynchronous; players do not need to be online together.
- Scope: one focused, playable MVP.

## Core player loop

1. Enter the shared world and claim a starting settlement.
2. Collect or produce resources.
3. Build and upgrade structures.
4. Wait while construction and production progress in real time.
5. Return to spend accumulated resources and make the next strategic decision.
6. See important changes in the world activity feed.

The loop should be satisfying with one player before complex player-versus-player systems are added.

## MVP resources

| Resource | Initial purpose |
|---|---|
| Wood | Basic construction |
| Stone | Building upgrades |
| Food | Basic upkeep / future population systems |
| Iron | Higher-tier construction and future military systems |

Resource rates, storage caps, and costs must be configuration-driven and documented. Avoid hardcoding balance values in UI components.

## MVP buildings

- **Town Hall:** settlement center; defines initial progression ceiling.
- **Lumber Mill:** produces wood.
- **Quarry:** produces stone.
- **Farm:** produces food.
- **Iron Mine:** produces iron when map/site rules permit it.

Each building has a level, construction duration, and server-defined production effect. The first playable slice may ship with Town Hall, Lumber Mill, Quarry, and Farm if that keeps delivery focused.

## World and map

- One finite, seeded world.
- Isometric visual presentation over logical grid coordinates.
- Terrain: plains, forest, hills, water.
- Settlements occupy valid map locations.
- Map supports pan and zoom.
- Selecting a settlement opens a details panel.
- The map represents server-owned state; it is not the source of truth.

## Offline progress

- Production accrues based on elapsed server time.
- Construction completes at its persisted completion timestamp.
- Progress survives browser closure, API restart, and simulation worker restart.
- Storage caps prevent unlimited accumulation.
- Calculations use server time and are safe to retry.

## Explicit MVP exclusions

Player-vs-player combat, raids, sieges, armies, player-created kingdoms, guild hierarchies, advanced diplomacy, full player-driven auction house, real-time synchronous battles, multiple worlds/shards, large-scale territory warfare, and a mobile-native app.

These are future possibilities, not hidden MVP requirements.

## Acceptance criteria

1. A new user can register, log in, and enter the world.
2. The user receives exactly one starting settlement in that world.
3. The isometric map loads terrain and settlement markers from API data.
4. The player can view resource balances and building levels.
5. The player can start a valid construction job; invalid or unaffordable commands are rejected server-side.
6. Production and construction progress while the player is offline.
7. API/worker restarts do not lose or duplicate progress.
8. A player cannot spend another player's resources or modify another player's settlement.
9. Important actions appear in a basic activity history.
10. The core loop has automated unit and integration coverage.

## Design tone

Dark fantasy should feel atmospheric, ancient, and lived-in—not visually noisy. Prioritize legibility: resource counts, construction timers, settlement status, and map navigation. Decorative effects must not obscure strategic information.
