import { describe, expect, it } from "vitest";

import { Engine, resourceSystem, type ResourceState, type System } from "../src";

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
