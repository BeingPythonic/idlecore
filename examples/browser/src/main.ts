import {
  Engine,
  EngineScheduler,
  achievementIsEarned,
  canPurchaseGenerator,
  canPurchaseUpgrade,
  createGeneratorSystem,
  createProgressionSystem,
  getGeneratorCost,
  getResourceAmount,
  purchaseGenerator,
  purchaseUpgrade,
  resourceAtLeast,
  resourceSystem,
  setGeneratorMultiplier,
  type AchievementDefinition,
  type GameplayState,
  type GeneratorDefinition,
  type UnlockDefinition,
  type UpgradeDefinition,
} from "idlecore";

interface BrowserGameState extends GameplayState {
  stats: {
    totalOreMined: number;
  };
}

const miner: GeneratorDefinition<BrowserGameState> = {
  id: "miner",
  name: "Miner",
  baseCosts: [{ resourceId: "gold", amount: 10 }],
  costScale: 1.45,
  produces: [
    {
      resourceId: "ore",
      amountPerSecond: (state, generator) =>
        generator.multiplier * (state.unlocks.foundry?.unlocked ? 1.5 : 1),
    },
  ],
  isUnlocked: resourceAtLeast("gold", 10),
};

const drillUpgrade: UpgradeDefinition<BrowserGameState> = {
  id: "steelDrill",
  name: "Steel Drill",
  costs: [{ resourceId: "gold", amount: 30 }],
  isUnlocked: (state) => (state.generators.miner?.owned ?? 0) >= 1,
  canPurchase: resourceAtLeast("gold", 30),
  onPurchase: [
    (state) => {
      setGeneratorMultiplier(state, "miner", 2);
    },
  ],
};

const unlocks: UnlockDefinition<BrowserGameState>[] = [
  {
    id: "foundry",
    name: "Foundry",
    condition: resourceAtLeast("ore", 25),
  },
];

const achievements: AchievementDefinition<BrowserGameState>[] = [
  {
    id: "orePioneer",
    name: "Ore Pioneer",
    condition: resourceAtLeast("ore", 50),
  },
];

const engine = new Engine<BrowserGameState>({
  resources: {
    gold: { amount: 25, rate: 3 },
    ore: { amount: 0, rate: 0 },
  },
  generators: {},
  upgrades: {},
  unlocks: {},
  achievements: {},
  stats: {
    totalOreMined: 0,
  },
});

engine.registerSystem(resourceSystem);
engine.registerSystem(
  createGeneratorSystem([
    {
      ...miner,
      produces: [
        {
          resourceId: "ore",
          amountPerSecond: (state, generator) => {
            const perSecond =
              typeof miner.produces[0].amountPerSecond === "number"
                ? miner.produces[0].amountPerSecond
                : miner.produces[0].amountPerSecond(state, generator);
            return perSecond;
          },
        },
      ],
    },
  ]),
);
engine.registerSystem((state, dt) => {
  const oreRate = state.generators.miner
    ? state.generators.miner.owned *
      state.generators.miner.multiplier *
      (state.unlocks.foundry?.unlocked ? 1.5 : 1)
    : 0;

  state.stats.totalOreMined += oreRate * dt;
});
engine.registerSystem(
  createProgressionSystem({
    generators: [miner],
    upgrades: [drillUpgrade],
    unlocks,
    achievements,
  }),
);

const scheduler = new EngineScheduler(engine, {
  step: 0.25,
  intervalMs: 250,
});

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("app container not found");
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">idlecore browser example</p>
      <h1>Build a tiny mining loop.</h1>
      <p class="lede">
        This example runs the real framework in the browser with generators,
        upgrades, unlocks, achievements, and the runtime scheduler.
      </p>
    </section>
    <section class="grid">
      <article class="panel panel-stats">
        <h2>Economy</h2>
        <div class="stat-row"><span>Gold</span><strong id="gold-value"></strong></div>
        <div class="stat-row"><span>Ore</span><strong id="ore-value"></strong></div>
        <div class="stat-row"><span>Total ore mined</span><strong id="ore-total"></strong></div>
        <div class="stat-row"><span>Gold / sec</span><strong id="gold-rate"></strong></div>
        <div class="stat-row"><span>Ore / sec</span><strong id="ore-rate"></strong></div>
      </article>
      <article class="panel panel-actions">
        <h2>Actions</h2>
        <button id="buy-miner" class="action"></button>
        <button id="buy-upgrade" class="action"></button>
        <button id="simulate-offline" class="ghost">Simulate 30s Offline</button>
      </article>
      <article class="panel panel-progression">
        <h2>Progression</h2>
        <div class="tag-row">
          <span class="tag" id="unlock-foundry"></span>
          <span class="tag" id="achievement-ore"></span>
        </div>
        <div class="stat-row"><span>Miners owned</span><strong id="miner-owned"></strong></div>
        <div class="stat-row"><span>Miner multiplier</span><strong id="miner-multiplier"></strong></div>
        <div class="stat-row"><span>Upgrade level</span><strong id="upgrade-level"></strong></div>
      </article>
    </section>
  </main>
`;

const goldValue = requireElement("gold-value");
const oreValue = requireElement("ore-value");
const oreTotal = requireElement("ore-total");
const goldRate = requireElement("gold-rate");
const oreRate = requireElement("ore-rate");
const minerOwned = requireElement("miner-owned");
const minerMultiplier = requireElement("miner-multiplier");
const upgradeLevel = requireElement("upgrade-level");
const unlockFoundry = requireElement("unlock-foundry");
const achievementOre = requireElement("achievement-ore");
const buyMinerButton = requireButton("buy-miner");
const buyUpgradeButton = requireButton("buy-upgrade");
const simulateOfflineButton = requireButton("simulate-offline");

buyMinerButton.addEventListener("click", () => {
  purchaseGenerator(engine.state, miner);
  render();
});

buyUpgradeButton.addEventListener("click", () => {
  purchaseUpgrade(engine.state, drillUpgrade);
  render();
});

simulateOfflineButton.addEventListener("click", () => {
  engine.simulate(30, 0.25);
  render();
});

scheduler.start();
render();
window.setInterval(render, 100);

function render(): void {
  const generatorState = engine.state.generators.miner ?? {
    owned: 0,
    unlocked: false,
    multiplier: 1,
  };
  const upgradeState = engine.state.upgrades.steelDrill ?? {
    level: 0,
    unlocked: false,
  };
  const nextMinerCost = getGeneratorCost(engine.state, miner)[0]?.amount ?? 0;
  const orePerSecond =
    generatorState.owned *
    generatorState.multiplier *
    (engine.state.unlocks.foundry?.unlocked ? 1.5 : 1);

  goldValue.textContent = formatNumber(getResourceAmount(engine.state, "gold"));
  oreValue.textContent = formatNumber(getResourceAmount(engine.state, "ore"));
  oreTotal.textContent = formatNumber(engine.state.stats.totalOreMined);
  goldRate.textContent = formatNumber(engine.state.resources.gold.rate);
  oreRate.textContent = formatNumber(orePerSecond);
  minerOwned.textContent = String(generatorState.owned);
  minerMultiplier.textContent = `${formatNumber(generatorState.multiplier)}x`;
  upgradeLevel.textContent = String(upgradeState.level);
  unlockFoundry.textContent = engine.state.unlocks.foundry?.unlocked
    ? "Foundry unlocked"
    : "Foundry locked";
  achievementOre.textContent = achievementIsEarned("orePioneer")(engine.state)
    ? "Ore Pioneer earned"
    : "Ore Pioneer in progress";

  buyMinerButton.disabled = !canPurchaseGenerator(engine.state, miner);
  buyMinerButton.textContent = `Buy Miner (${formatNumber(nextMinerCost)} gold)`;

  buyUpgradeButton.disabled = !canPurchaseUpgrade(engine.state, drillUpgrade);
  buyUpgradeButton.textContent = `Buy Steel Drill (30 gold)`;
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`element "${id}" not found`);
  }

  return element;
}

function requireButton(id: string): HTMLButtonElement {
  const element = requireElement(id);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`element "${id}" is not a button`);
  }

  return element;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
