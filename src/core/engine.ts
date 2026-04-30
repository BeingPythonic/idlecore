import type { System } from "./types";
import { assertObjectState, assertPositiveNumber } from "../shared/validation";

const EPSILON = 1e-12;

export class Engine<TState> {
  readonly state!: TState;

  private readonly systems: System<TState>[] = [];
  private started = false;

  constructor(initialState: TState) {
    assertObjectState(initialState);

    Object.defineProperty(this, "state", {
      value: initialState,
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }

  registerSystem(system: System<TState>): this {
    if (this.started) {
      throw new Error("cannot register systems after simulation has started");
    }

    if (this.systems.includes(system)) {
      throw new Error("cannot register duplicate systems");
    }

    this.systems.push(system);
    return this;
  }

  tick(dt: number): TState {
    assertPositiveNumber(dt, "dt");
    this.started = true;

    for (const system of this.systems) {
      system(this.state, dt);
    }

    return this.state;
  }

  simulate(totalTime: number, step = totalTime): TState {
    assertPositiveNumber(totalTime, "totalTime");
    assertPositiveNumber(step, "step");
    this.started = true;

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
