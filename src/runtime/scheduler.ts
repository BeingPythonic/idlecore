import type { Engine } from "../core/engine";
import { assertPositiveNumber } from "../shared/validation";

const EPSILON = 1e-12;

export interface SchedulerClock {
  now(): number;
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

export interface EngineSchedulerOptions {
  step: number;
  intervalMs?: number;
  maxFrameTime?: number;
  clock?: SchedulerClock;
}

export class EngineScheduler<TState> {
  private readonly step: number;
  private readonly intervalMs: number;
  private readonly maxFrameTime: number;
  private readonly clock: SchedulerClock;

  private accumulated = 0;
  private handle: unknown = null;
  private lastTimestamp = 0;

  constructor(
    private readonly engine: Engine<TState>,
    options: EngineSchedulerOptions,
  ) {
    assertPositiveNumber(options.step, "step");

    this.step = options.step;
    this.intervalMs = options.intervalMs ?? options.step * 1000;
    this.maxFrameTime = options.maxFrameTime ?? options.step * 10;
    this.clock = options.clock ?? createSystemClock();
  }

  start(): void {
    if (this.handle !== null) {
      return;
    }

    this.lastTimestamp = this.clock.now();
    this.handle = this.clock.setInterval(() => {
      this.flush();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.handle === null) {
      return;
    }

    this.clock.clearInterval(this.handle);
    this.handle = null;
    this.accumulated = 0;
  }

  flush(): number {
    const now = this.clock.now();
    const deltaSeconds = Math.min(
      (now - this.lastTimestamp) / 1000,
      this.maxFrameTime,
    );

    this.lastTimestamp = now;
    this.accumulated += deltaSeconds;

    let ticks = 0;

    while (this.accumulated + EPSILON >= this.step) {
      this.engine.tick(this.step);
      this.accumulated -= this.step;
      ticks += 1;
    }

    return ticks;
  }

  tickOnce(dt = this.step): TState {
    return this.engine.tick(dt);
  }

  isRunning(): boolean {
    return this.handle !== null;
  }

  getPendingTime(): number {
    return this.accumulated;
  }
}

export function createSystemClock(): SchedulerClock {
  const timerHost = globalThis as typeof globalThis & {
    clearInterval(handle: unknown): void;
    setInterval(callback: () => void, intervalMs: number): unknown;
  };

  return {
    now: () => Date.now(),
    clearInterval: (handle) => {
      timerHost.clearInterval(handle);
    },
    setInterval: (callback, intervalMs) =>
      timerHost.setInterval(callback, intervalMs),
  };
}
