export * from "./get-next-or-previous-number.js";
export * from "./get-progression-game-max-starting-floor.js";
export * from "./array-utils.js";
export * from "./rand-between.js";
export * from "./shape-utils.js";

import { Quaternion, Vector3 } from "@babylonjs/core";
import { CONSUMABLE_TYPE_STRINGS, Consumable, ConsumableType } from "../items/consumables/index.js";
import { BoxDimensions } from "./shape-utils.js";
import { NextOrPrevious } from "../primatives/index.js";

export function iterateNumericEnum<T extends { [name: string]: string | number }>(
  enumType: T
): T[keyof T][] {
  return Object.values(enumType).filter((value) => !isNaN(Number(value))) as T[keyof T][];
}

export function iterateNumericEnumKeyedRecord<T extends string | number, U>(
  record: Partial<Record<T, U>>
): [T, U][] {
  return Object.entries(record)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => [parseInt(key) as T, value as U]);
}

export function randomNormal() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randomNormal(); // resample between 0 and 1
  return num;
}

export function formatVector3(vec3: Vector3) {
  return `x: ${vec3.x}, y: ${vec3.y}, z: ${vec3.z}`;
}

export function cloneVector3(vec3: Vector3) {
  return new Vector3(vec3.x, vec3.y, vec3.z);
}

export function getProgressionGamePartyName(gameName: string) {
  return `Delvers of ${gameName}`;
}

export function isBrowser() {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}

export function stringIsValidNumber(str: string) {
  return !isNaN(parseInt(str)) && str.trim() !== "";
}

export function createDummyConsumable(consumableType: ConsumableType) {
  return new Consumable(
    { name: CONSUMABLE_TYPE_STRINGS[consumableType], id: "" },
    0,
    {},
    consumableType,
    1
  );
}

export class SequentialIdGenerator {
  private nextId: number = 0;
  constructor() {}
  getNextId() {
    return String(this.nextId++);
  }
  getNextIdNumeric() {
    return this.nextId++;
  }
}

export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeIn(t: number) {
  return t * t;
}

export function easeOut(t: number) {
  return t * (2 - t);
}

export function getQuaternionAngleDifference(q1: Quaternion, q2: Quaternion): number {
  const normalized1 = q1.clone().normalize();
  const normalized2 = q2.clone().normalize();

  const dot = normalized1.dot(normalized2);
  const clampedDot = Math.min(Math.max(dot, -1), 1); // Clamp for numerical safety
  return 2 * Math.acos(clampedDot); // Result is in radians
}

export function throwIfError<T>(result: T | Error) {
  if (result instanceof Error) throw result;
  return result;
}

export type KeysWithValueOfType<O, T> = {
  [K in keyof O]: O[K] extends T ? K : never;
}[keyof O];

export function formatThousandsAsK(value: number): string {
  if (value < 1000) return value.toString();
  return (value / 1000).toFixed(2).replace(/\.?0+$/, "") + "k";
}

export function getLookRotationFromPositions(
  fromPosition: Vector3,
  toPosition: Vector3
): Quaternion {
  const direction = toPosition.subtract(fromPosition);
  direction.y = 0; // Eliminate vertical component to constrain to XZ plane

  if (direction.lengthSquared() === 0) {
    return Quaternion.Identity();
  }

  direction.normalize();
  const up = Vector3.Up(); // Y axis

  return Quaternion.FromLookDirectionRH(direction, up);
}

const EPSILON = 1e-8; // tiny value to prevent division by zero in ray-AABB calculations

export function timeToReachBox(
  userPosition: Vector3,
  destination: Vector3,
  boxCenter: Vector3,
  boxDimensions: BoxDimensions,
  movementSpeed: number // units per ms
): number | null {
  // Compute min/max of AABB
  const half = (value: number) => value / 2;
  const min = boxCenter.subtract(
    new Vector3(half(boxDimensions.width), half(boxDimensions.height), half(boxDimensions.depth))
  );
  const max = boxCenter.add(
    new Vector3(half(boxDimensions.width), half(boxDimensions.height), half(boxDimensions.depth))
  );

  const dir = destination.subtract(userPosition);
  const dirFrac = new Vector3(
    1 / (dir.x || EPSILON),
    1 / (dir.y || EPSILON),
    1 / (dir.z || EPSILON)
  );

  // Using "slab method" for line-segment vs AABB intersection
  const t1 = (min.x - userPosition.x) * dirFrac.x;
  const t2 = (max.x - userPosition.x) * dirFrac.x;
  const t3 = (min.y - userPosition.y) * dirFrac.y;
  const t4 = (max.y - userPosition.y) * dirFrac.y;
  const t5 = (min.z - userPosition.z) * dirFrac.z;
  const t6 = (max.z - userPosition.z) * dirFrac.z;

  const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
  const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));

  // No intersection if tMax < 0 (behind start) or tMin > tMax (misses)
  if (tMax < 0 || tMin > tMax || tMin > 1 || tMin < 0) return null;

  const distanceToFirewall = dir.length() * tMin;
  const timeToFirewall = distanceToFirewall / movementSpeed;

  return timeToFirewall;
}

export function nameToPossessive(name: string): string {
  if (!name) return name;
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

export function cycleListGivenCurrentValue<T>(
  list: Array<T>,
  current: T,
  direction: NextOrPrevious
): T {
  if (list.length < 1) throw new Error("Tried to cycle an empty list");
  let currentIndex = list.indexOf(current);
  if (currentIndex === -1) throw new Error("Current value was not found in provided list");

  let newIndex;
  switch (direction) {
    case NextOrPrevious.Next:
      if (currentIndex < list.length - 1) newIndex = currentIndex + 1;
      else newIndex = 0;
      break;
    case NextOrPrevious.Previous:
      if (currentIndex > 0) newIndex = currentIndex - 1;
      else newIndex = list.length - 1;
  }

  const cycledTo = list[newIndex];

  if (cycledTo === undefined) throw new Error("Target not found in list");
  return cycledTo;
}
