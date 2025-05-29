export * from "./hash-set.js";
export * from "./hash-map.js";
export * from "./entity-properties.js";
export * from "./max-and-current.js";
export * from "./number-range.js";
export type EntityId = string;
export enum NextOrPrevious {
  Next,
  Previous,
}
export interface Point {
  x: number;
  y: number;
}

export type Milliseconds = number;
export type Seconds = number;

export type Percentage = number;
/** A number that is expected to be between 0 and 1 */
export type NormalizedPercentage = number;

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
