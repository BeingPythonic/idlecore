import type { System } from "../core/types";
import { syncGeneratorState } from "./generators";
import { syncUpgradeState } from "./upgrades";
import type {
  AchievementDefinition,
  AchievementStateEntry,
  GameplayState,
  ProgressionDefinitions,
  UnlockDefinition,
  UnlockStateEntry,
} from "./types";

export function createProgressionSystem<TState extends GameplayState>(
  definitions: ProgressionDefinitions<TState>,
): System<TState> {
  return (state) => {
    for (const definition of definitions.generators ?? []) {
      syncGeneratorState(state, definition);
    }

    for (const definition of definitions.upgrades ?? []) {
      syncUpgradeState(state, definition);
    }

    for (const definition of definitions.unlocks ?? []) {
      const unlock = syncUnlockState(state, definition);

      if (!unlock.unlocked && definition.condition(state)) {
        unlock.unlocked = true;

        for (const effect of definition.onUnlock ?? []) {
          effect(state);
        }
      }
    }

    for (const definition of definitions.achievements ?? []) {
      const achievement = syncAchievementState(state, definition);

      if (!achievement.earned && definition.condition(state)) {
        achievement.earned = true;

        for (const effect of definition.onEarn ?? []) {
          effect(state);
        }
      }
    }
  };
}

export function resourceAtLeast<TState extends GameplayState>(
  resourceId: string,
  amount: number,
): (state: TState) => boolean {
  return (state) => (state.resources[resourceId]?.amount ?? 0) >= amount;
}

export function generatorOwnedAtLeast<TState extends GameplayState>(
  generatorId: string,
  amount: number,
): (state: TState) => boolean {
  return (state) => (state.generators[generatorId]?.owned ?? 0) >= amount;
}

export function upgradeLevelAtLeast<TState extends GameplayState>(
  upgradeId: string,
  amount: number,
): (state: TState) => boolean {
  return (state) => (state.upgrades[upgradeId]?.level ?? 0) >= amount;
}

export function unlockIsActive<TState extends GameplayState>(
  unlockId: string,
): (state: TState) => boolean {
  return (state) => state.unlocks[unlockId]?.unlocked === true;
}

export function achievementIsEarned<TState extends GameplayState>(
  achievementId: string,
): (state: TState) => boolean {
  return (state) => state.achievements[achievementId]?.earned === true;
}

function syncUnlockState<TState extends GameplayState>(
  state: TState,
  definition: UnlockDefinition<TState>,
): UnlockStateEntry {
  const existing = state.unlocks[definition.id];

  if (existing) {
    return existing;
  }

  const created: UnlockStateEntry = {
    unlocked: false,
  };

  state.unlocks[definition.id] = created;
  return created;
}

function syncAchievementState<TState extends GameplayState>(
  state: TState,
  definition: AchievementDefinition<TState>,
): AchievementStateEntry {
  const existing = state.achievements[definition.id];

  if (existing) {
    return existing;
  }

  const created: AchievementStateEntry = {
    earned: false,
  };

  state.achievements[definition.id] = created;
  return created;
}
