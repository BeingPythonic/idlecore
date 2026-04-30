import type {
  GameplayState,
  UpgradeDefinition,
  UpgradeStateEntry,
} from "./types";
import { canAffordCosts, payCosts } from "./costs";

export function canPurchaseUpgrade<TState extends GameplayState>(
  state: TState,
  definition: UpgradeDefinition<TState>,
): boolean {
  const upgrade = syncUpgradeState(state, definition);

  if (!upgrade.unlocked) {
    return false;
  }

  if (!definition.repeatable && upgrade.level > 0) {
    return false;
  }

  if (
    definition.maxLevel !== undefined &&
    upgrade.level >= definition.maxLevel
  ) {
    return false;
  }

  if (definition.canPurchase && !definition.canPurchase(state)) {
    return false;
  }

  return canAffordCosts(state, definition.costs);
}

export function purchaseUpgrade<TState extends GameplayState>(
  state: TState,
  definition: UpgradeDefinition<TState>,
): boolean {
  if (!canPurchaseUpgrade(state, definition)) {
    return false;
  }

  payCosts(state, definition.costs);

  const upgrade = syncUpgradeState(state, definition);
  upgrade.level += 1;

  for (const effect of definition.onPurchase ?? []) {
    effect(state);
  }

  return true;
}

export function syncUpgradeState<TState extends GameplayState>(
  state: TState,
  definition: UpgradeDefinition<TState>,
): UpgradeStateEntry {
  const existing = state.upgrades[definition.id];

  if (existing) {
    if (
      !existing.unlocked &&
      isDefinitionUnlocked(state, definition.isUnlocked)
    ) {
      existing.unlocked = true;
    }

    return existing;
  }

  const created: UpgradeStateEntry = {
    level: 0,
    unlocked: isDefinitionUnlocked(state, definition.isUnlocked),
  };

  state.upgrades[definition.id] = created;
  return created;
}

function isDefinitionUnlocked<TState extends GameplayState>(
  state: TState,
  condition: UpgradeDefinition<TState>["isUnlocked"],
): boolean {
  return condition ? condition(state) : true;
}
