export function invertRecordRatios<K extends PropertyKey>(
  ratios: Partial<Record<K, Partial<Record<K, number>>>>
): Partial<Record<K, Partial<Record<K, number>>>> {
  const reversed: Partial<Record<K, Partial<Record<K, number>>>> = {};

  for (const [from, targets] of Object.entries(ratios) as [K, Partial<Record<K, number>>][]) {
    for (const [to, ratio] of Object.entries(targets) as [K, number][]) {
      let record = reversed[to];
      if (record === undefined) {
        record = {};
      }
      record[from] = 1 / ratio;
      reversed[to] = record;
    }
  }

  return reversed;
}
