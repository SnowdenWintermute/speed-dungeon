export * from "./get-next-or-previous-number.js";
import { Vector3 } from "@babylonjs/core";

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
