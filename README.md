# idlecore

`idlecore` is a deterministic TypeScript engine for incremental and idle games.

## Structure

```text
src/
  core/
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
import { Engine, resourceSystem, type ResourceState } from "idlecore";

const engine = new Engine<ResourceState>({
  resources: {
    gold: {
      amount: 0,
      rate: 1,
    },
  },
});

engine.registerSystem(resourceSystem);

engine.simulate(10);

console.log(engine.state.resources.gold.amount); // 10
```

## Integration Example

A small consumer project lives in `examples/basic`.

```bash
pnpm install
pnpm build
pnpm example:basic
```

That project imports `idlecore` through a local package link and runs a deterministic resource simulation.

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
