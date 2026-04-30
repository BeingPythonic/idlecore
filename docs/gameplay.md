# Gameplay Guide

## Core Shape

The current gameplay layer is built around a deterministic mutable state object:

```ts
interface GameplayState {
  resources: Record<string, { amount: number; rate: number }>;
  generators: Record<
    string,
    { owned: number; unlocked: boolean; multiplier: number }
  >;
  upgrades: Record<string, { level: number; unlocked: boolean }>;
  unlocks: Record<string, { unlocked: boolean }>;
  achievements: Record<string, { earned: boolean }>;
}
```

## Costs and Purchases

Use the cost helpers when you need explicit purchase flow:

- `canAffordCosts`
- `payCosts`
- `getResourceAmount`
- `addResourceAmount`
- `scaleCosts`

Generator and upgrade purchases build on top of those helpers:

- `canPurchaseGenerator`
- `purchaseGenerator`
- `getGeneratorCost`
- `canPurchaseUpgrade`
- `purchaseUpgrade`

## Generators and Buildings

Generators are data-driven definitions with:

- `id`
- `baseCosts`
- optional `costScale`
- `produces`
- optional `isUnlocked`
- optional `onPurchase`

Register them with `createGeneratorSystem(...)` so owned generators emit resources each tick.

## Progression

Unlocks and achievements are evaluated by `createProgressionSystem(...)`.

Useful condition helpers:

- `resourceAtLeast`
- `generatorOwnedAtLeast`
- `upgradeLevelAtLeast`
- `unlockIsActive`
- `achievementIsEarned`

These are intended to be composed into content definitions rather than hardcoded into the engine.

## Catalog Synchronization

Use:

- `syncGeneratorState`
- `syncUpgradeState`

when you need to prepare mutable state entries before gameplay begins or before reading them directly from UI code.

## Runtime Scheduling

Use `EngineScheduler` when you need a real-time loop on top of the deterministic engine.

- `tickOnce()` advances one fixed step immediately
- `start()` / `stop()` manage a real-time interval loop
- `flush()` converts accumulated clock time into deterministic engine ticks

For tests or custom environments, pass a custom `clock`.
