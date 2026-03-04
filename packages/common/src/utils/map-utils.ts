import { ClassConstructor, Transform, TransformFnParams, plainToInstance } from "class-transformer";

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

// Source - https://stackoverflow.com/a/78901448
// Posted by pcba-dev
// Retrieved 2026-03-04, License - CC BY-SA 4.0
export function MapTransform<V>(cls: ClassConstructor<V>): PropertyDecorator {
  return Transform(
    ({ value }: TransformFnParams) => {
      const map = new Map<string, V>();
      for (const [key, val] of Object.entries(value)) {
        map.set(key, plainToInstance(cls, val));
      }
      return map;
    },
    { toClassOnly: true }
  );
}

export function SetTransform<V>(cls: ClassConstructor<V>): PropertyDecorator {
  return Transform(
    ({ value }: TransformFnParams) => {
      if (!Array.isArray(value)) return value;
      return new Set<V>(value.map((item) => plainToInstance(cls, item)));
    },
    { toClassOnly: true }
  );
}
