export class MapUtils {
  static getFirstEntry<K, V>(map: Map<K, V>): [K, V] | undefined {
    const result = map.entries().next();
    return result.done ? undefined : result.value;
  }

  static getFirstValue<K, V>(map: Map<K, V>): V | undefined {
    const result = map.values().next();
    return result.done ? undefined : result.value;
  }

  static serialize<K, V, S = V>(
    map: Map<K, V>,
    valueSerializer?: (value: V, key: K) => S
  ): [K, S][] {
    const serializeValue = valueSerializer ?? ((v: V) => v as unknown as S);

    return [...map.entries()].map(([k, v]) => [k, serializeValue(v, k)]);
  }

  static deserialize<K, V, S = V>(
    entries: [K, S][],
    valueDeserializer?: (value: S, key: K) => V
  ): Map<K, V> {
    const deserializeValue = valueDeserializer ?? ((v: S) => v as unknown as V);

    return new Map(entries.map(([k, v]) => [k, deserializeValue(v, k)]));
  }
}
