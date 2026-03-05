import {
  ClassConstructor,
  Transform,
  TransformFnParams,
  instanceToPlain,
  plainToInstance,
} from "class-transformer";

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

function applyDecorators(...decorators: PropertyDecorator[]): PropertyDecorator {
  return (target, key) => decorators.forEach((d) => d(target, key));
}

// Source - https://stackoverflow.com/a/78901448
// Posted by pcba-dev
// Retrieved 2026-03-04, License - CC BY-SA 4.0
export function MapTransform<V>(cls: ClassConstructor<V>): PropertyDecorator {
  return applyDecorators(
    Transform(
      ({ value }) => {
        const map = new Map<string, V>();
        for (const [key, val] of Object.entries(value)) {
          map.set(key, plainToInstance(cls, val));
        }
        return map;
      },
      { toClassOnly: true }
    ),
    Transform(
      ({ value }) => {
        if (!(value instanceof Map)) return value;
        return Object.fromEntries([...value.entries()].map(([k, v]) => [k, instanceToPlain(v)]));
      },
      { toPlainOnly: true }
    )
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
