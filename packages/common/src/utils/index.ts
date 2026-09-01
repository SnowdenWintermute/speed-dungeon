import { Quaternion, Vector3 } from "@babylonjs/core";
import { CONSUMABLE_TYPE_STRINGS, Consumable } from "../items/consumables/index.js";
import { BoxDimensions } from "./shape-utils.js";
import { NextOrPrevious } from "../primatives/index.js";
import { toJS } from "mobx";
import cloneDeep from "lodash.clonedeep";
import { plainToInstance } from "class-transformer";
import { EntityId, EntityName, GameName, Milliseconds, PartyName } from "../aliases.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import {
  LOOP_SAFETY_ITERATION_LIMIT,
  ONE_SECOND,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "../app-consts.js";

export * from "./numeric-enum-iteration.js";

export function invariant(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    console.trace();
    throw new Error(`${ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED}${message ? `: ${message}` : ""}`);
  }
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

export function getProgressionGamePartyName(gameName: GameName) {
  return `Delvers of ${gameName}` as PartyName;
}

export function isBrowser() {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}

export function runIfInBrowser(callback: () => void) {
  if (isBrowser()) callback();
}

export function stringIsValidNumber(str: string) {
  return !isNaN(parseInt(str)) && str.trim() !== "";
}

export function normalizeKeyValue(raw: string): string {
  return raw.toLowerCase();
}

export function createDummyConsumable(consumableType: ConsumableType) {
  return new Consumable(
    {
      name: CONSUMABLE_TYPE_STRINGS[consumableType] as EntityName,
      id: CONSUMABLE_TYPE_STRINGS[consumableType] as EntityId,
    },
    0,
    {},
    consumableType,
    1
  );
}

export class SequentialIdGenerator {
  private nextId: number = 0;
  getNextId() {
    return String(this.nextId++);
  }
  getNextIdNumeric() {
    return this.nextId++;
  }
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

// the teens are the exception a bare modulo-10 rule gets wrong: 11th, not 11st
export function formatOrdinal(value: number): string {
  const lastTwoDigits = value % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

// an elapsed span, not a moment: Date would wrap past 24 hours and pad every duration to hh:mm:ss
export function formatDuration(milliseconds: Milliseconds): string {
  const totalSeconds = Math.floor(milliseconds / ONE_SECOND);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const segments = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return segments
    .map((segment, index) =>
      index === 0 ? segment.toString() : segment.toString().padStart(2, "0")
    )
    .join(":");
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

export const EPSILON = 1e-8; // tiny value to prevent division by zero in ray-AABB calculations (and others)

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

export function cycleListGivenCurrentValue<T>(list: T[], current: T, direction: NextOrPrevious): T {
  if (list.length < 1) throw new Error("Tried to cycle an empty list");
  const currentIndex = list.indexOf(current);
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

export function cloneObservable<T>(cls: new (...args: any[]) => T, obj: T): T {
  const plain = toJS(obj); // remove MobX proxies
  const clonedPlain = cloneDeep(plain); // ensure deep structural copy
  return plainToInstance(cls, clonedPlain); // restore class prototype
}

/** The idea is that two attributes contribute well if they are balanced, otherwise there is a penalty but they
 * still contribute */
export function calculateBalancedAttributeSynergy(attributeA: number, attributeB: number): number {
  // Base value is additive when stats are equal
  const base = attributeA + attributeB;

  // Calculate imbalance
  const diff = Math.abs(attributeA - attributeB);

  // Tunable penalty coefficient (higher = stronger punishment)
  const penaltyCoefficient = 4.5;

  // Apply logarithmic reduction scaled by coefficient
  const imbalancePenalty = Math.log1p(diff) * penaltyCoefficient;

  const total = base - imbalancePenalty;

  return Math.max(1, Math.round(total));
}

export function removeUndefinedFields<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as T;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

// ordinal, not localeCompare: this exists to order the same way a database does, and locale-aware
// comparison can disagree with Postgres on punctuation. wherever a sort has to hold whether it ran
// in typescript or in SQL, the comparison comes from here
export function compareStringsOrdinally(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function throwIfLoopLimitReached(safetyCounter: number, message?: string) {
  if (safetyCounter >= LOOP_SAFETY_ITERATION_LIMIT) {
    throw new Error(
      ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT) +
        " " +
        message
    );
  }
}
