import type { System } from "../core/types";

export interface Resource {
  amount: number;
  rate: number;
}

export interface ResourceState {
  resources: Record<string, Resource>;
}

export const resourceSystem: System<ResourceState> = (state, dt) => {
  for (const resource of Object.values(state.resources)) {
    resource.amount += resource.rate * dt;
  }
};
