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

export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i]!, array[j]!] = [array[j]!, array[i]!];
  }
  return array;
}
