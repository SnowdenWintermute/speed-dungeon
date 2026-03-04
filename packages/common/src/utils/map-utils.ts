import {
  ClassConstructor,
  Transform,
  TransformFnParams,
  instanceToPlain,
  plainToInstance,
} from "class-transformer";

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
