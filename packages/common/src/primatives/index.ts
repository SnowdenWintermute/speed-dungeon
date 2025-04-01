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
