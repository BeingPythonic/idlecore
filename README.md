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

## Example Project

A simple consumer project lives in `examples/basic`.

```bash
pnpm install
pnpm build
pnpm example:basic
```

That example imports `idlecore` as a dependency and runs a small deterministic resource simulation.

## API

### `Engine<TState>`

- Holds mutable state for a simulation run.
- Registers systems with `registerSystem(system)`.
- Advances time with `tick(dt)`.
- Simulates a time span with `simulate(totalTime, step?)`.

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

## Current Gaps

- API safety rules are still being tightened around invalid inputs and engine lifecycle behavior.
- Edge-case tests are being added ahead of the corresponding implementation hardening.
