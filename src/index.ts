export { Engine } from "./core";
export type { System } from "./core";
export {
  addResourceAmount,
  achievementIsEarned,
  canAffordCosts,
  canPurchaseGenerator,
  canPurchaseUpgrade,
  createGeneratorSystem,
  createProgressionSystem,
  getGeneratorCost,
  getResourceAmount,
  generatorOwnedAtLeast,
  payCosts,
  purchaseGenerator,
  purchaseUpgrade,
  resourceAtLeast,
  scaleCosts,
  setGeneratorMultiplier,
  syncGeneratorState,
  syncUpgradeState,
  unlockIsActive,
  upgradeLevelAtLeast,
} from "./gameplay";
export type {
  AchievementDefinition,
  AchievementStateEntry,
  Condition,
  Cost,
  Effect,
  GameplayState,
  GeneratorDefinition,
  GeneratorStateEntry,
  ProductionRule,
  ProgressionDefinitions,
  UnlockDefinition,
  UnlockStateEntry,
  UpgradeDefinition,
  UpgradeStateEntry,
} from "./gameplay";
export { EngineScheduler, createSystemClock } from "./runtime";
export type { EngineSchedulerOptions, SchedulerClock } from "./runtime";
export { resourceSystem } from "./systems";
export type { Resource, ResourceState } from "./systems";
