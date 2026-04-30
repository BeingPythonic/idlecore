import { describe, expect, it } from "vitest";

import {
  Engine,
  EngineScheduler,
  addResourceAmount,
  canPurchaseGenerator,
  createGeneratorSystem,
  createProgressionSystem,
  generatorOwnedAtLeast,
  purchaseGenerator,
  purchaseUpgrade,
  resourceAtLeast,
  setGeneratorMultiplier,
  syncGeneratorState,
  type AchievementDefinition,
  type GameplayState,
  type GeneratorDefinition,
  type SchedulerClock,
  type UnlockDefinition,
  type UpgradeDefinition,
} from "../src";

describe("gameplay framework", () => {
  it("supports generators, upgrades, unlocks, and achievements in one simulation", () => {
    const state = createTestState();
    const miner = createMinerDefinition();
    const drillUpgrade = createDrillUpgrade();
    const unlocks = createUnlockDefinitions();
    const achievements = createAchievementDefinitions();

    const engine = new Engine(state);
    engine.registerSystem(createGeneratorSystem([miner]));
    engine.registerSystem(
      createProgressionSystem({
        generators: [miner],
        upgrades: [drillUpgrade],
        unlocks,
        achievements,
      }),
    );

    expect(state.generators.miner).toBeUndefined();

    engine.tick(1);

    expect(state.generators.miner?.unlocked).toBe(true);
    expect(purchaseGenerator(state, miner)).toBe(true);
    expect(state.resources.gold.amount).toBe(5);

    engine.simulate(5, 1);
    expect(state.resources.ore.amount).toBe(5);
    expect(state.unlocks.oreProduction?.unlocked).toBe(true);

    addResourceAmount(state, "gold", 10);
    expect(purchaseUpgrade(state, drillUpgrade)).toBe(true);
    expect(state.upgrades.steelDrill.level).toBe(1);
    expect(state.generators.miner.multiplier).toBe(2);

    engine.simulate(5, 1);
    expect(state.resources.ore.amount).toBe(15);
    expect(state.achievements.firstDrill?.earned).toBe(true);
  });

  it("applies generator cost scaling deterministically", () => {
    const state = createTestState();
    const miner = createMinerDefinition();

    syncGeneratorState(state, miner);

    expect(canPurchaseGenerator(state, miner)).toBe(true);
    expect(purchaseGenerator(state, miner)).toBe(true);
    expect(state.resources.gold.amount).toBe(5);

    addResourceAmount(state, "gold", 7);
    expect(purchaseGenerator(state, miner)).toBe(true);
    expect(state.resources.gold.amount).toBe(3.25);
    expect(state.generators.miner.owned).toBe(2);
  });

  it("supports runtime scheduling through a clock adapter", () => {
    const state = createTestState();
    const miner = createMinerDefinition();
    const clock = createFakeClock();

    const engine = new Engine(state);
    engine.registerSystem(createGeneratorSystem([miner]));
    engine.registerSystem(
      createProgressionSystem({
        generators: [miner],
      }),
    );

    engine.tick(1);
    purchaseGenerator(state, miner);

    const scheduler = new EngineScheduler(engine, {
      step: 1,
      intervalMs: 1000,
      clock,
    });

    scheduler.start();
    clock.advance(1000);
    expect(clock.flush()).toBe(1);
    expect(state.resources.ore.amount).toBe(1);

    clock.advance(2000);
    expect(clock.flush()).toBe(1);
    expect(state.resources.ore.amount).toBe(3);

    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
  });

  it("lets upgrades modify generator multipliers cleanly", () => {
    const state = createTestState();
    const miner = createMinerDefinition();

    syncGeneratorState(state, miner);
    setGeneratorMultiplier(state, "miner", 3);

    expect(state.generators.miner.multiplier).toBe(3);
  });
});

function createTestState(): GameplayState {
  return {
    resources: {
      gold: { amount: 10, rate: 0 },
      ore: { amount: 0, rate: 0 },
    },
    generators: {},
    upgrades: {},
    unlocks: {},
    achievements: {},
  };
}

function createMinerDefinition(): GeneratorDefinition<GameplayState> {
  return {
    id: "miner",
    name: "Miner",
    baseCosts: [{ resourceId: "gold", amount: 5 }],
    costScale: 1.75,
    produces: [
      {
        resourceId: "ore",
        amountPerSecond: 1,
      },
    ],
    isUnlocked: resourceAtLeast("gold", 5),
  };
}

function createDrillUpgrade(): UpgradeDefinition<GameplayState> {
  return {
    id: "steelDrill",
    name: "Steel Drill",
    costs: [{ resourceId: "gold", amount: 10 }],
    isUnlocked: generatorOwnedAtLeast("miner", 1),
    onPurchase: [
      (state) => {
        setGeneratorMultiplier(state, "miner", 2);
      },
    ],
  };
}

function createUnlockDefinitions(): UnlockDefinition<GameplayState>[] {
  return [
    {
      id: "oreProduction",
      name: "Ore Production",
      condition: resourceAtLeast("ore", 5),
    },
  ];
}

function createAchievementDefinitions(): AchievementDefinition<GameplayState>[] {
  return [
    {
      id: "firstDrill",
      name: "First Drill",
      condition: resourceAtLeast("ore", 15),
    },
  ];
}

function createFakeClock(): SchedulerClock & {
  advance(ms: number): void;
  flush(): number;
} {
  let now = 0;
  let callback: (() => void) | null = null;

  return {
    now: () => now,
    setInterval: (nextCallback) => {
      callback = nextCallback;
      return 1;
    },
    clearInterval: () => {
      callback = null;
    },
    advance: (ms) => {
      now += ms;
    },
    flush: () => {
      if (!callback) {
        return 0;
      }

      callback();
      return 1;
    },
  };
}
