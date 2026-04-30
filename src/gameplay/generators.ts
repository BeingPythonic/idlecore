import type { System } from "../core/types";
import { assertPositiveNumber } from "../shared/validation";
import {
  addResourceAmount,
  canAffordCosts,
  payCosts,
  scaleCosts,
} from "./costs";
import type {
  GameplayState,
  GeneratorDefinition,
  GeneratorStateEntry,
} from "./types";

const DEFAULT_COST_SCALE = 1.15;

export function createGeneratorSystem<TState extends GameplayState>(
  definitions: GeneratorDefinition<TState>[],
): System<TState> {
  return (state, dt) => {
    for (const definition of definitions) {
      const generator = syncGeneratorState(state, definition);

      if (!generator.unlocked || generator.owned === 0) {
        continue;
      }

      for (const production of definition.produces) {
        // Production rules stay data-driven: a generator can emit fixed values
        // or compute output from the wider game state.
        const amountPerSecond =
          typeof production.amountPerSecond === "number"
            ? production.amountPerSecond
            : production.amountPerSecond(state, generator);

        addResourceAmount(
          state,
          production.resourceId,
          amountPerSecond * generator.owned * generator.multiplier * dt,
        );
      }
    }
  };
}

export function getGeneratorCost<TState extends GameplayState>(
  state: TState,
  definition: GeneratorDefinition<TState>,
): ReturnType<typeof scaleCosts> {
  const generator = syncGeneratorState(state, definition);
  const multiplier =
    (definition.costScale ?? DEFAULT_COST_SCALE) ** generator.owned;

  return scaleCosts(definition.baseCosts, multiplier);
}

export function canPurchaseGenerator<TState extends GameplayState>(
  state: TState,
  definition: GeneratorDefinition<TState>,
): boolean {
  const generator = syncGeneratorState(state, definition);

  if (!generator.unlocked) {
    return false;
  }

  return canAffordCosts(state, getGeneratorCost(state, definition));
}

export function purchaseGenerator<TState extends GameplayState>(
  state: TState,
  definition: GeneratorDefinition<TState>,
): boolean {
  if (!canPurchaseGenerator(state, definition)) {
    return false;
  }

  payCosts(state, getGeneratorCost(state, definition));

  const generator = syncGeneratorState(state, definition);
  generator.owned += 1;

  for (const effect of definition.onPurchase ?? []) {
    effect(state);
  }

  return true;
}

export function syncGeneratorState<TState extends GameplayState>(
  state: TState,
  definition: GeneratorDefinition<TState>,
): GeneratorStateEntry {
  // Definitions describe the catalog; state tracks the mutable owned/unlocked
  // data for a specific playthrough.
  const existing = state.generators[definition.id];

  if (existing) {
    if (
      !existing.unlocked &&
      isDefinitionUnlocked(state, definition.isUnlocked)
    ) {
      existing.unlocked = true;
    }

    return existing;
  }

  const created: GeneratorStateEntry = {
    owned: 0,
    unlocked: isDefinitionUnlocked(state, definition.isUnlocked),
    multiplier: 1,
  };

  state.generators[definition.id] = created;
  return created;
}

export function setGeneratorMultiplier<TState extends GameplayState>(
  state: TState,
  generatorId: string,
  multiplier: number,
): void {
  assertPositiveNumber(multiplier, "multiplier");

  const generator = state.generators[generatorId];

  if (!generator) {
    throw new Error(`generator "${generatorId}" does not exist`);
  }

  generator.multiplier = multiplier;
}

function isDefinitionUnlocked<TState extends GameplayState>(
  state: TState,
  condition: GeneratorDefinition<TState>["isUnlocked"],
): boolean {
  return condition ? condition(state) : true;
}
