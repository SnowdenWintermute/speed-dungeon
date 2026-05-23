export enum NextOrPrevious {
  Next,
  Previous,
}

export enum BeforeOrAfter {
  Before,
  After,
}

export interface Point {
  x: number;
  y: number;
}

export enum Axis {
  X,
  Y,
  Z,
}

export const AXES_TO_STRING: Record<Axis, string> = {
  [Axis.X]: "x",
  [Axis.Y]: "y",
  [Axis.Z]: "z",
};

export type AllowedResult = { allowed: true } | { allowed: false; reason: string };
export function requireAllowed(result: AllowedResult): void {
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
