import {
  assertNonNegativeNumber,
  assertPositiveNumber,
} from "../shared/validation";
import type { ResourceState } from "../systems/resource";
import type { Cost } from "./types";

const COST_PRECISION = 1_000_000;

export function canAffordCosts<TState extends ResourceState>(
  state: TState,
  costs: Cost[],
): boolean {
  for (const cost of costs) {
    if (getResourceAmount(state, cost.resourceId) < cost.amount) {
      return false;
    }
  }

  return true;
}

export function payCosts<TState extends ResourceState>(
  state: TState,
  costs: Cost[],
): void {
  if (!canAffordCosts(state, costs)) {
    throw new Error("insufficient resources");
  }

  for (const cost of costs) {
    addResourceAmount(state, cost.resourceId, -cost.amount);
  }
}

export function addResourceAmount<TState extends ResourceState>(
  state: TState,
  resourceId: string,
  amount: number,
): void {
  const resource = state.resources[resourceId];
  assertResource(resource, resourceId);
  resource.amount = roundAmount(resource.amount + amount);
}

export function getResourceAmount<TState extends ResourceState>(
  state: TState,
  resourceId: string,
): number {
  const resource = state.resources[resourceId];
  assertResource(resource, resourceId);
  return resource.amount;
}

export function scaleCosts(baseCosts: Cost[], multiplier: number): Cost[] {
  assertPositiveNumber(multiplier, "multiplier");

  return baseCosts.map((cost) => {
    assertNonNegativeNumber(cost.amount, `cost amount for ${cost.resourceId}`);

    return {
      resourceId: cost.resourceId,
      amount: roundAmount(cost.amount * multiplier),
    };
  });
}

function assertResource(
  resource: ResourceState["resources"][string] | undefined,
  resourceId: string,
): asserts resource is ResourceState["resources"][string] {
  if (!resource) {
    throw new Error(`resource "${resourceId}" does not exist`);
  }
}

function roundAmount(value: number): number {
  return Math.round(value * COST_PRECISION) / COST_PRECISION;
}
