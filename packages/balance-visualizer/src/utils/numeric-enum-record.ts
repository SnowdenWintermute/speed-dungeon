import { iterateNumericEnum } from "@speed-dungeon/common";

/**
 * Builds a record keyed by every member of a numeric enum. Object.fromEntries widens its key type to
 * string, so the one cast lives here rather than at each call site that would otherwise spell the
 * enum's members out by hand.
 */
export function numericEnumKeyedRecord<T extends Record<string, string | number>, U>(
  enumType: T,
  valueOf: (key: T[keyof T]) => U
): Record<T[keyof T], U> {
  const entries = iterateNumericEnum(enumType).map((key) => [key, valueOf(key)]);
  return Object.fromEntries(entries) as Record<T[keyof T], U>;
}
