# AFTERHOURS
### A world that never sleeps.

> Build your legacy. Defend it. Shape a world that moves on without you.

**AFTERHOURS** is a browser-based, asynchronous multiplayer dark-fantasy strategy game. Players explore a shared persistent world, establish settlements, develop characters, collect resources, equip weapons, and fight other players using **swords, guns, and magic**.

The world continues to evolve while players are offline. Your decisions have consequences beyond a single session.

---

## At a glance

| | |
|---|---|
| Genre | Dark-fantasy strategy, RPG and PvP |
| Platform | Web browser |
| Multiplayer | Shared, asynchronous world |
| World view | Isometric |
| Combat | Player-versus-player; swords, firearms and magic |
| Progression | Characters, equipment, settlements and resources |
| Initial goal | A playable world with character progression and PvP |

## The world

AFTERHOURS is set in a dark-fantasy world of forgotten kingdoms, ruined settlements, dangerous wilderness, ancient magic and scarce resources.

Players enter the same persistent world and build their influence over time. Settlements provide a base of operations, while characters venture into the world, acquire equipment and engage in conflict.

The visual direction is atmospheric medieval fantasy, with a distinctive isometric world view. The interface should prioritize clarity and readable combat information.

## Core gameplay

1. **Enter the world** — create an account and establish your presence.
2. **Develop your settlement** — gather resources and improve your base.
3. **Build instantly** — when requirements are met and resources are paid, buildings are placed immediately. There are no construction timers, construction queues or construction-progress graphics.
4. **Develop characters** — improve attributes, unlock abilities and create a combat build.
5. **Acquire weapons** — choose between melee weapons, firearms and magical weapons or abilities.
6. **Fight other players** — engage in PvP and compete for influence and resources.
7. **Return to a changing world** — the shared world continues to progress while you are away.

## Characters

Characters are the player's presence in the world and the foundation of combat and progression.

A character system may include:

- **Attributes:** health, strength, agility, endurance and intelligence or magical aptitude.
- **Progression:** experience, levels, attribute growth and unlockable abilities.
- **Equipment:** weapons, armour and other useful gear.
- **Abilities:** active skills, passive effects and weapon-specific techniques.
- **Builds:** players can specialize in a combat style or combine different approaches.

### Combat archetypes

These are starting archetype concepts, not restrictive classes:

| Archetype | Style |
|---|---|
| Warrior | Close-range combat, swords, durability and physical strength |
| Gunslinger | Ranged combat, firearms, precision and mobility |
| Arcanist | Offensive and defensive magic, spells and resource management |
| Battlemage | A hybrid approach combining weapons and magic |

Players should have room to shape their own builds rather than being permanently locked into one class.

## Weapons and magic

Combat is built around three central weapon families.

| Weapon family | Examples | Gameplay identity |
|---|---|---|
| Swords | Longswords, greatswords, daggers | Melee damage, combos, blocks and close-range pressure |
| Guns | Pistols, rifles, shotguns | Ranged damage, accuracy, reloads and ammunition management |
| Magic | Elemental spells, arcane attacks, defensive spells | Range, area effects, utility and mana or energy management |

Weapons and abilities can differ through damage, range, attack speed, accuracy, durability, rarity and special effects. Equipment progression should create meaningful choices rather than making every higher-tier weapon a simple replacement.

Magic is a combat discipline in its own right. It can support direct damage, defence, control and utility. Weapon and magic combinations should allow hybrid builds such as a sword-wielding battlemage.

The exact weapon catalogue, statistics, balance and ability list will be defined during implementation and playtesting.

## Player-versus-player combat

PvP is a core part of AFTERHOURS, not an afterthought. Players should be able to test their character builds and equipment against other players in the shared world.

The combat system is intended to support:

- **Player duels:** direct fights between players.
- **Settlement conflict:** attacks and defence connected to player settlements, subject to agreed protection and balance rules.
- **Weapon-based combat:** swords, guns and magic each offer distinct strengths, weaknesses and counters.
- **Character-based outcomes:** attributes, abilities, equipment and player decisions all matter.
- **Persistent results:** combat outcomes and important events are recorded in the world.

Because the game is asynchronous, combat must not require both players to be online simultaneously. The server will resolve combat using authoritative game rules and persisted character state. The exact attack flow, defensive options, offline protection, losses and rewards must be specified before implementation.

Fairness matters: combat outcomes must be validated by the server, and players must not be able to alter health, damage, inventory or battle results through the browser.

## Settlements and resources

Settlements give players a base from which to gather resources, manage equipment and expand their influence.

The initial resource concepts are:

- **Wood** — basic materials.
- **Stone** — settlement development.
- **Food** — supplies and future upkeep systems.
- **Iron** — equipment and advanced development.

Buildings can provide resource production, storage or other settlement benefits. Building placement is immediate once its requirements are satisfied and its cost is paid. The MVP will not include construction timers, construction queues or construction-progress animations/graphics.

The server determines resource balances, costs, ownership and production. The browser only displays the resulting game state.

## Persistent world and game rules

The world is shared and continues independently of a player's browser session.

Core principles:

- Server time is authoritative; client clocks are never trusted.
- Player, character, settlement, inventory and combat state are stored persistently.
- Resource production is calculated from elapsed time and respects storage limits.
- Building placement and upgrades apply immediately after server-side validation.
- Combat is resolved by server-side rules, never by client-submitted results.
- Important actions, PvP outcomes and world changes are recorded.
- Retried operations must not duplicate rewards, costs or combat outcomes.

The initial implementation should favor a reliable, understandable system over unnecessary infrastructure.

## MVP scope

The first playable release should focus on:

- Account registration, login and player profiles.
- One shared persistent world with an isometric map.
- Player settlements and basic resource management.
- Instant building placement and upgrades; no construction visuals or timers.
- Characters with attributes, progression and equipment.
- Swords, guns and magic as the three core combat paths.
- A server-authoritative PvP foundation.
- Persistent combat records and a basic activity history.
- Ownership checks, validation and automated tests.

Large-scale faction warfare, diplomacy, kingdoms, trading markets, extensive PvE, multiple worlds and advanced territory systems can follow after the core experience is stable.

## Proposed technology

The following is the proposed baseline, not a claim that these systems are already implemented.

| Area | Proposed technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Isometric rendering | PixiJS |
| Backend | Node.js, Fastify |
| Database | PostgreSQL, Prisma |
| Live updates | WebSockets where needed |
| Simulation | Separate Node.js worker |
| Testing | Vitest and integration/E2E tests |
| Local development | pnpm workspaces, Docker Compose |

The server and database remain authoritative for all gameplay. Redis, Kubernetes and microservices are not required for the initial version.

## Team and ownership

| Contributor | Responsibility |
|---|---|
| Raghav | Project lead: product direction, scope, priorities, acceptance criteria and PR reviews |
| Chirrayu | Backend: API, authentication, database, persistence and server-side validation |
| Mohit | Frontend: application structure, interface, map presentation and player-facing screens |
| Saransh | Testing and frontend: automated tests, integration, regression and UI states |
| Manan | Game systems: world rules, resources, character/combat mechanics and deterministic simulation |

Cross-team decisions—especially combat rules, data contracts and balance—should be agreed before implementation.

## Contribution workflow

- Work from the existing personal branch assigned to you.
- Use one long-lived personal branch per contributor; do not create feature branches.
- Submit pull requests targeting `main`.
- Keep each PR focused, testable and tied to an agreed requirement.
- Include screenshots for relevant interface changes and tests for gameplay changes.
- Do not push directly to `main`.
- The maintainer reviews and merges contributions.

| Person | Personal branch |
|---|---|
| Raghav | `Raghav` (if/when created) |
| Chirrayu | `chirrayu` |
| Mohit | `mohit` |
| Saransh | `Saransh` |
| Manan | `Manan` |

Do not create or rename branches without maintainer approval. Keep unrelated work out of a PR, and resolve review feedback before merging.

## Project status

**Stage: product definition and foundation.**

This README describes the intended direction. The systems above should not be considered implemented until the corresponding code, tests and review have landed.

The immediate goal is to deliver a persistent dark-fantasy world where players develop characters, choose how to fight, and compete through meaningful PvP.

---

*AFTERHOURS — The world doesn't wait for you.*

*Built under the Before Hours project.*
