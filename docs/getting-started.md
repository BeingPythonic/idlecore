# Getting Started

## Model Your Game State

Start with a mutable state object that includes:

- `resources`
- `generators`
- `upgrades`
- `unlocks`
- `achievements`

The gameplay helpers assume those collections exist even when they begin empty.

## Register Systems

Most games will register at least:

1. `resourceSystem` for passive resource income
2. `createGeneratorSystem(...)` for generator/building production
3. `createProgressionSystem(...)` for unlocks and achievements

The order matters: production systems should usually run before progression so unlock conditions evaluate against the latest tick result.

## Drive Simulation

Use:

- `tick(dt)` for deterministic manual control
- `simulate(totalTime, step)` for offline progress or batched advancement
- `EngineScheduler` when you need a real-time runtime adapter

## Build the Library

```bash
pnpm build
```

## Verify the Repository

```bash
pnpm verify
```

## Run Tests

```bash
pnpm test:run
```

## Run the Integration Example

```bash
pnpm install
pnpm build
pnpm example:basic
```

The integration project imports `idlecore` through a local package link and simulates a resource economy with generators, upgrades, unlocks, and achievements.

## Learn the Gameplay Layer

See `docs/gameplay.md` for the current gameplay API surface and design patterns.
