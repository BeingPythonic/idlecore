import type { ResourceState } from "../systems/resource";

export type Condition<TState> = (state: TState) => boolean;
export type Effect<TState> = (state: TState) => void;

export interface Cost {
  resourceId: string;
  amount: number;
}

export interface GeneratorStateEntry {
  owned: number;
  unlocked: boolean;
  multiplier: number;
}

export interface UpgradeStateEntry {
  level: number;
  unlocked: boolean;
}

export interface UnlockStateEntry {
  unlocked: boolean;
}

export interface AchievementStateEntry {
  earned: boolean;
}

export interface GameplayState extends ResourceState {
  generators: Record<string, GeneratorStateEntry>;
  upgrades: Record<string, UpgradeStateEntry>;
  unlocks: Record<string, UnlockStateEntry>;
  achievements: Record<string, AchievementStateEntry>;
}

export interface ProductionRule<TState extends GameplayState> {
  resourceId: string;
  amountPerSecond:
    | number
    | ((state: TState, generator: GeneratorStateEntry) => number);
}

export interface GeneratorDefinition<TState extends GameplayState> {
  id: string;
  name?: string;
  baseCosts: Cost[];
  costScale?: number;
  produces: ProductionRule<TState>[];
  isUnlocked?: Condition<TState>;
  onPurchase?: Effect<TState>[];
}

export interface UpgradeDefinition<TState extends GameplayState> {
  id: string;
  name?: string;
  costs: Cost[];
  repeatable?: boolean;
  maxLevel?: number;
  isUnlocked?: Condition<TState>;
  canPurchase?: Condition<TState>;
  onPurchase?: Effect<TState>[];
}

export interface UnlockDefinition<TState extends GameplayState> {
  id: string;
  name?: string;
  condition: Condition<TState>;
  onUnlock?: Effect<TState>[];
}

export interface AchievementDefinition<TState extends GameplayState> {
  id: string;
  name?: string;
  condition: Condition<TState>;
  onEarn?: Effect<TState>[];
}

export interface ProgressionDefinitions<TState extends GameplayState> {
  generators?: GeneratorDefinition<TState>[];
  upgrades?: UpgradeDefinition<TState>[];
  unlocks?: UnlockDefinition<TState>[];
  achievements?: AchievementDefinition<TState>[];
}
