# idlecore

`idlecore` is a deterministic TypeScript framework for incremental and idle games.

## Structure

```text
src/
  core/
  gameplay/
  runtime/
  shared/
  systems/
docs/
examples/
  basic/
tests/
```

## Install

```bash
pnpm add idlecore
```

## Usage

```ts
import {
  Engine,
  EngineScheduler,
  canPurchaseGenerator,
  canPurchaseUpgrade,
  createGeneratorSystem,
  createProgressionSystem,
  getGeneratorCost,
  purchaseGenerator,
  purchaseUpgrade,
  resourceSystem,
  resourceAtLeast,
  setGeneratorMultiplier,
  unlockIsActive,
  type GameplayState,
} from "idlecore";

const miner = {
  id: "miner",
  baseCosts: [{ resourceId: "gold", amount: 5 }],
  produces: [{ resourceId: "ore", amountPerSecond: 1 }],
  isUnlocked: resourceAtLeast("gold", 5),
};

const drillUpgrade = {
  id: "steelDrill",
  costs: [{ resourceId: "gold", amount: 10 }],
  isUnlocked: (state: GameplayState) => state.generators.miner?.owned >= 1,
  onPurchase: [
    (state: GameplayState) => {
      setGeneratorMultiplier(state, "miner", 2);
    },
  ],
};

const engine = new Engine<GameplayState>({
  resources: {
    gold: { amount: 20, rate: 3 },
    ore: { amount: 0, rate: 0 },
  },
  generators: {},
  upgrades: {},
  unlocks: {},
  achievements: {},
});

engine.registerSystem(resourceSystem);
engine.registerSystem(createGeneratorSystem([miner]));
engine.registerSystem(
  createProgressionSystem({
    generators: [miner],
    upgrades: [drillUpgrade],
    unlocks: [{ id: "oreProduction", condition: resourceAtLeast("ore", 5) }],
    achievements: [{ id: "orePioneer", condition: resourceAtLeast("ore", 10) }],
  }),
);

engine.tick(1);

if (canPurchaseGenerator(engine.state, miner)) {
  purchaseGenerator(engine.state, miner);
}

if (canPurchaseUpgrade(engine.state, drillUpgrade)) {
  purchaseUpgrade(engine.state, drillUpgrade);
}

const scheduler = new EngineScheduler(engine, { step: 1 });
console.log(getGeneratorCost(engine.state, miner));

scheduler.tickOnce();
engine.simulate(4, 1);
console.log(unlockIsActive("oreProduction")(engine.state));
```

## Integration Example

A small consumer project lives in `examples/basic`.

```bash
pnpm install
pnpm build
pnpm example:basic
```

That project imports `idlecore` through a local package link and runs a deterministic resource economy with generators, upgrades, unlocks, and achievements.

## Verification

```bash
pnpm verify
```

This runs formatting checks, linting, tests, the package build, and the integration consumer project.

## API

### `Engine<TState>`

- Holds mutable state for a simulation run.
- Registers systems with `registerSystem(system)`.
- Advances time with `tick(dt)`.
- Simulates a time span with `simulate(totalTime, step?)`.
- Rejects non-object initial state.
- Rejects duplicate system registration.
- Locks system registration once ticking or simulation starts.
- Exposes mutable state contents but prevents replacing `engine.state` itself.

### `System<TState>`

```ts
type System<TState> = (state: TState, dt: number) => void;
```

Systems must be deterministic and mutate only the provided state.

### Gameplay

- Generic resource costs and payment helpers
- Generator and building definitions with scalable costs
- Purchase helpers for generators and upgrades
- Unlock and achievement evaluation via reusable conditions
- Progression systems that keep catalog state synchronized with game state
- State synchronization helpers for generator and upgrade catalogs

### Runtime

- `EngineScheduler` for real-time fixed-step execution on top of the deterministic core
- Pluggable clock adapter for browser, Node, or test environments

## Guides

- `docs/getting-started.md`: project setup and first framework flow
- `docs/gameplay.md`: gameplay state, purchases, progression, and scheduler usage
- `docs/release.md`: release and publish hygiene

### `resourceSystem`

Applies `amount += rate * dt` to each entry in `state.resources`.

```ts
interface Resource {
  amount: number;
  rate: number;
}

interface ResourceState {
  resources: Record<string, Resource>;
}
```

## Determinism

- `simulate(totalTime)` is intended to match repeated shorter simulations that sum to the same total time.
- Tests prefer exact values with integer-friendly rates and step sizes to avoid floating-point drift in expectations.

## Maintenance

- `docs/getting-started.md` covers local development commands.
- `docs/release.md` covers release and publish hygiene.
- `CHANGELOG.md` tracks released and unreleased package changes.
