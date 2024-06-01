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
