export * from "./hash-set.js";
export * from "./option.js";
export * from "./hash-map.js";
export * from "./entity-properties.js";
export * from "./max-and-current.js";
export * from "./number-range.js";

export enum NextOrPrevious {
  Next,
  Previous,
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

export class ActionValidity {
  constructor(
    public isValid: boolean,
    public reason: string = "unspecified"
  ) {}
}
