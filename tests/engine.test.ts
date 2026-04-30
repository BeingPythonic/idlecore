import { describe, expect, it } from "vitest";

import {
  Engine,
  resourceSystem,
  type ResourceState,
  type System,
} from "../src";

describe("Engine", () => {
  it("runs registered systems during a tick", () => {
    const state = { value: 0 };
    const engine = new Engine(state);
    const system: System<typeof state> = (currentState, dt) => {
      currentState.value += dt * 2;
    };

    engine.registerSystem(system);
    engine.tick(3);

    expect(state.value).toBe(6);
  });

  it("simulate accumulates resources correctly", () => {
    const engine = createResourceEngine(1);

    engine.simulate(10);

    expect(engine.state.resources.gold.amount).toBe(10);
  });

  it("multiple ticks behave consistently with a single simulation", () => {
    const tickedEngine = createResourceEngine(2);
    const simulatedEngine = createResourceEngine(2);

    tickedEngine.tick(2);
    tickedEngine.tick(2);
    tickedEngine.tick(2);

    simulatedEngine.simulate(6);

    expect(tickedEngine.state.resources.gold.amount).toBe(
      simulatedEngine.state.resources.gold.amount,
    );
  });

  it("simulate in steps matches a single run", () => {
    const steppedEngine = createResourceEngine(3);
    const singleRunEngine = createResourceEngine(3);

    steppedEngine.simulate(10, 2);
    singleRunEngine.simulate(10);

    expect(steppedEngine.state.resources.gold.amount).toBe(
      singleRunEngine.state.resources.gold.amount,
    );
  });

  it("split simulations remain deterministic", () => {
    const splitEngine = createResourceEngine(4);
    const fullEngine = createResourceEngine(4);

    splitEngine.simulate(5);
    splitEngine.simulate(5);
    fullEngine.simulate(10);

    expect(splitEngine.state.resources.gold.amount).toBe(
      fullEngine.state.resources.gold.amount,
    );
  });

  it("supports a simulation step larger than the total time", () => {
    const engine = createResourceEngine(2);

    engine.simulate(3, 10);

    expect(engine.state.resources.gold.amount).toBe(6);
  });

  it("runs with no registered systems", () => {
    const state = { value: 1 };
    const engine = new Engine(state);

    engine.tick(5);
    engine.simulate(3);

    expect(engine.state.value).toBe(1);
  });

  it("updates multiple resources in one pass", () => {
    const engine = new Engine<ResourceState>({
      resources: {
        gold: { amount: 0, rate: 2 },
        wood: { amount: 10, rate: 3 },
      },
    });

    engine.registerSystem(resourceSystem);
    engine.simulate(4);

    expect(engine.state.resources.gold.amount).toBe(8);
    expect(engine.state.resources.wood.amount).toBe(22);
  });

  it("handles exact fractional steps consistently when they divide evenly", () => {
    const steppedEngine = createResourceEngine(8);
    const singleRunEngine = createResourceEngine(8);

    steppedEngine.simulate(2, 0.5);
    singleRunEngine.simulate(2);

    expect(steppedEngine.state.resources.gold.amount).toBe(
      singleRunEngine.state.resources.gold.amount,
    );
  });
});

describe("Engine input validation", () => {
  it.each([
    ["tick", () => new Engine({}).tick(0)],
    ["tick", () => new Engine({}).tick(-1)],
    ["tick", () => new Engine({}).tick(Number.NaN)],
    ["simulate", () => new Engine({}).simulate(0)],
    ["simulate", () => new Engine({}).simulate(-1)],
    ["simulate", () => new Engine({}).simulate(Number.POSITIVE_INFINITY)],
    ["simulate step", () => new Engine({}).simulate(1, 0)],
    ["simulate step", () => new Engine({}).simulate(1, -1)],
  ])("rejects invalid %s inputs", (_, run) => {
    expect(run).toThrow(/positive finite number/);
  });
});

describe("Engine API safety", () => {
  it("rejects non-object state inputs", () => {
    expect(() => new Engine<number>(1)).toThrow(/state/i);
  });

  it("prevents registering systems after ticking begins", () => {
    const engine = createResourceEngine(1);

    engine.tick(1);

    expect(() => engine.registerSystem(resourceSystem)).toThrow(/started/i);
  });

  it("rejects duplicate system registration", () => {
    const engine = createResourceEngine(1);

    expect(() => engine.registerSystem(resourceSystem)).toThrow(/duplicate/i);
  });

  it("protects engine state from external replacement", () => {
    const engine = createResourceEngine(1);

    expect(() => {
      (engine as { state: ResourceState }).state = {
        resources: {
          gold: {
            amount: 99,
            rate: 99,
          },
        },
      };
    }).toThrow();
  });
});

function createResourceEngine(rate: number): Engine<ResourceState> {
  const engine = new Engine<ResourceState>({
    resources: {
      gold: {
        amount: 0,
        rate,
      },
    },
  });

  engine.registerSystem(resourceSystem);

  return engine;
}
