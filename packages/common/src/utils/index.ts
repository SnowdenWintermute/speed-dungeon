export * from "./get-next-or-previous-number.js";
export * from "./get-progression-game-max-starting-floor.js";

import { Quaternion, Vector3 } from "@babylonjs/core";
import { CONSUMABLE_TYPE_STRINGS, Consumable, ConsumableType } from "../items/consumables/index.js";

export function removeFromArray<T>(array: T[], item: T): undefined | T {
  const indexToRemove = array.indexOf(item);
  if (indexToRemove !== -1) {
    return array.splice(indexToRemove, 1)[0];
  }
}

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

/** random number between two given numbers, inclusive */
export function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function chooseRandomFromArray<T>(arr: T[]): Error | T {
  if (arr.length < 1) return new Error("Array is empty");
  const randomIndex = randBetween(0, arr.length - 1);
  const randomMember = arr[randomIndex];
  if (randomMember === undefined) return new Error("Somehow randomly chose undefined from array");
  return randomMember;
}

export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const toSwap = array[j]!;
    array[j] = array[i]!;
    array[i] = toSwap;
  }
  return array;
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
  const forward = toPosition.subtract(fromPosition).normalize();

  const defaultForward = new Vector3(0, 0, 1); // Babylon.js default forward

  const dot = Vector3.Dot(defaultForward, forward);

  if (dot > 0.999999) {
    return Quaternion.Identity();
  }

  if (dot < -0.999999) {
    // 180 degrees turn
    const orthogonal = Vector3.Cross(Vector3.Up(), defaultForward);
    if (orthogonal.lengthSquared() < 0.0001) {
      orthogonal.copyFrom(Vector3.Cross(Vector3.Right(), defaultForward));
    }
    orthogonal.normalize();
    return Quaternion.RotationAxis(orthogonal, Math.PI);
  }

  const axis = Vector3.Cross(defaultForward, forward).normalize();
  const angle = Math.acos(dot);
  return Quaternion.RotationAxis(axis, angle);
}
