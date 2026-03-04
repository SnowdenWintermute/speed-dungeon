export class MapUtils {
  static deserialize<T, U>(raw: Map<T, U>) {
    const deserialized = new Map<T, U>();
    for (const [key, value] of Object.entries(raw)) {
      deserialized.set(key as T, value);
    }
    return deserialized;
  }

  static getFirstEntry<K, V>(map: Map<K, V>): [K, V] | undefined {
    const result = map.entries().next();
    return result.done ? undefined : result.value;
  }

  static getFirstValue<K, V>(map: Map<K, V>): V | undefined {
    const result = map.values().next();
    return result.done ? undefined : result.value;
  }
}
