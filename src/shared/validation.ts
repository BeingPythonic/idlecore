export function assertPositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
}

export function assertNonNegativeNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number`);
  }
}

export function assertObjectState<TState>(
  value: TState,
): asserts value is TState & object {
  if (typeof value !== "object" || value === null) {
    throw new Error("state must be a non-null object");
  }
}
