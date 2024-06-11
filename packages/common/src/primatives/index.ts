export * from "./hash-set";
export * from "./hash-map";
export * from "./entity-properties";
export * from "./max-and-current";
export * from "./number-range";
export type EntityId = string;
export enum NextOrPrevious {
  Next,
  Previous,
}
export interface Point {
  x: number;
  y: number;
}
