import {
  Engine,
  EngineScheduler,
  addResourceAmount,
  canAffordCosts,
  canPurchaseGenerator,
  canPurchaseUpgrade,
  createGeneratorSystem,
  createProgressionSystem,
  getGeneratorCost,
  getResourceAmount,
  purchaseGenerator,
  purchaseUpgrade,
  resourceSystem,
  resourceAtLeast,
  scaleCosts,
  syncGeneratorState,
  syncUpgradeState,
  unlockIsActive,
  upgradeLevelAtLeast,
  achievementIsEarned,
  payCosts,
  setGeneratorMultiplier,
} from "idlecore";

const engine = new Engine({
  resources: {
    gold: {
      amount: 20,
      rate: 3,
    },
    ore: {
      amount: 0,
      rate: 0,
    },
  },
  generators: {},
  upgrades: {},
  unlocks: {},
  achievements: {},
});

const schedulerClock = createManualClock();

const miner = {
  id: "miner",
  baseCosts: [{ resourceId: "gold", amount: 5 }],
  costScale: 1.5,
  produces: [
    {
      resourceId: "ore",
      amountPerSecond: 1,
    },
  ],
  isUnlocked: resourceAtLeast("gold", 5),
};

const drillUpgrade = {
  id: "steelDrill",
  costs: [{ resourceId: "gold", amount: 10 }],
  isUnlocked: (state) => state.generators.miner?.owned >= 1,
  onPurchase: [
    (state) => {
      setGeneratorMultiplier(state, "miner", 2);
    },
  ],
};

engine.registerSystem(resourceSystem);
engine.registerSystem(createGeneratorSystem([miner]));
engine.registerSystem(
  createProgressionSystem({
    generators: [miner],
    upgrades: [drillUpgrade],
    unlocks: [
      {
        id: "oreProduction",
        condition: resourceAtLeast("ore", 5),
      },
    ],
    achievements: [
      {
        id: "orePioneer",
        condition: resourceAtLeast("ore", 10),
      },
    ],
  }),
);

syncGeneratorState(engine.state, miner);
syncUpgradeState(engine.state, drillUpgrade);

engine.tick(1);

const previewCost = getGeneratorCost(engine.state, miner);
const canAffordMiner = canAffordCosts(engine.state, previewCost);

if (canAffordMiner && canPurchaseGenerator(engine.state, miner)) {
  purchaseGenerator(engine.state, miner);
}

if (canAffordCosts(engine.state, [{ resourceId: "gold", amount: 2 }])) {
  payCosts(engine.state, [{ resourceId: "gold", amount: 2 }]);
}

engine.simulate(2, 1);
addResourceAmount(engine.state, "gold", 4);

if (canPurchaseUpgrade(engine.state, drillUpgrade)) {
  purchaseUpgrade(engine.state, drillUpgrade);
}

const scheduler = new EngineScheduler(engine, {
  step: 1,
  intervalMs: 1000,
  clock: schedulerClock,
});

scheduler.start();
schedulerClock.advance(5000);
schedulerClock.flush();
scheduler.stop();

console.log("Idlecore integration example");
console.log(`gold: ${getResourceAmount(engine.state, "gold")}`);
console.log(`ore: ${engine.state.resources.ore.amount}`);
console.log(`miners: ${engine.state.generators.miner.owned}`);
console.log(`next miner cost: ${previewCost[0].amount}`);
console.log(`scaled baseline: ${scaleCosts(miner.baseCosts, 1.5)[0].amount}`);
console.log(
  `scaled preview: ${getGeneratorCost(engine.state, miner)[0].amount}`,
);
console.log(`can purchase miner: ${canPurchaseGenerator(engine.state, miner)}`);
console.log(
  `upgrade unlocked: ${upgradeLevelAtLeast("steelDrill", 1)(engine.state)}`,
);
console.log(`ore unlocked: ${unlockIsActive("oreProduction")(engine.state)}`);
console.log(
  `achievement earned: ${achievementIsEarned("orePioneer")(engine.state)}`,
);

function createManualClock() {
  let now = 0;
  let callback = null;

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
