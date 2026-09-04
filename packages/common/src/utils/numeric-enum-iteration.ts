export function iterateNumericEnum<T extends Record<string, string | number>>(
  enumType: T
): T[keyof T][] {
  return Object.values(enumType).filter((value) => !isNaN(Number(value))) as T[keyof T][];
}

export function getNumericEnumValues(enumObj: object): number[] {
  return Object.values(enumObj).filter((v): v is number => typeof v === "number");
}

// hand rolled rather than Object.entries().filter().map(): this is the inner loop of every
// attribute accumulator, and the chained version allocated four arrays per call instead of one
export function iterateNumericEnumKeyedRecord<T extends string | number, U>(
  record: Partial<Record<T, U>>
): [T, U][] {
  const entries: [T, U][] = [];
  // for..in gives string keys, which do not index a numeric-enum-keyed record
  const stringKeyed = record as Record<string, U | undefined>;

  for (const key in stringKeyed) {
    const value = stringKeyed[key];
    if (value === undefined) {
      continue;
    }
    entries.push([Number(key) as T, value]);
  }

  return entries;
}

// a numeric enum object holds its own reverse mapping, so a member is a key of it and a value that
// was never declared is not
export function isNumericEnumMember(enumObject: Record<number, string>, value: number): boolean {
  return enumObject[value] !== undefined;
}
