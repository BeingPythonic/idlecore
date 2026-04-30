import type { System } from "./types";
import { assertPositiveNumber } from "../shared/validation";

const EPSILON = 1e-12;

export class Engine<TState> {
  readonly state: TState;

  private readonly systems: System<TState>[] = [];

  constructor(initialState: TState) {
    this.state = initialState;
  }

  registerSystem(system: System<TState>): this {
    this.systems.push(system);
    return this;
  }

  tick(dt: number): TState {
    assertPositiveNumber(dt, "dt");

    for (const system of this.systems) {
      system(this.state, dt);
    }

    return this.state;
  }

  simulate(totalTime: number, step = totalTime): TState {
    assertPositiveNumber(totalTime, "totalTime");
    assertPositiveNumber(step, "step");

    const steps = Math.floor(totalTime / step);

    for (let index = 0; index < steps; index += 1) {
      this.tick(step);
    }

    const remainder = totalTime - steps * step;

    if (remainder > EPSILON) {
      this.tick(remainder);
    }

    return this.state;
  }
}
