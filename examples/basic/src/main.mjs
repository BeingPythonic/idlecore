import {
  Engine,
  createGeneratorSystem,
  createProgressionSystem,
  purchaseGenerator,
  purchaseUpgrade,
  resourceAtLeast,
  setGeneratorMultiplier,
} from "idlecore";

const engine = new Engine({
  resources: {
    gold: {
      amount: 20,
      rate: 0,
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

engine.tick(1);
purchaseGenerator(engine.state, miner);
purchaseUpgrade(engine.state, drillUpgrade);
engine.simulate(5, 1);

console.log("Idlecore integration example");
console.log(`gold: ${engine.state.resources.gold.amount}`);
console.log(`ore: ${engine.state.resources.ore.amount}`);
console.log(`miners: ${engine.state.generators.miner.owned}`);
console.log(`ore unlocked: ${engine.state.unlocks.oreProduction.unlocked}`);
console.log(
  `achievement earned: ${engine.state.achievements.orePioneer.earned}`,
);
