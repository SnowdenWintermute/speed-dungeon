import { iterateNumericEnumKeyedRecord } from "./numeric-enum-iteration.js";
import { Serializable, SerializedOf } from "../serialization/index.js";

interface NumericEnumLike {
  [key: string]: string | number;
  [key: number]: string;
}

export class NumericEnumUtils {
  static serializePartialNumericEnumRecord<K extends number, V extends Serializable>(
    record: Partial<Record<K, V>>
  ) {
    const serialized: Partial<Record<K, SerializedOf<V>>> = {};

    for (const [key, value] of iterateNumericEnumKeyedRecord(record)) {
      if (value !== undefined) {
        serialized[key] = value.toSerialized() as SerializedOf<V>;
      }
    }
    return serialized;
  }

  static serializeNumericEnumRecord<K extends number, V extends Serializable>(
    record: Record<K, V>
  ) {
    const serialized: Partial<Record<K, SerializedOf<V>>> = {};

    for (const [key, value] of iterateNumericEnumKeyedRecord(record)) {
      serialized[key] = value.toSerialized() as SerializedOf<V>;
    }

    return serialized as Record<K, SerializedOf<V>>;
  }

  static deserializeNumericEnumRecord<K extends number, V extends Serializable>(
    serialized: Partial<Record<K, SerializedOf<V>>>,
    valueDeserializer: (data: SerializedOf<V>, key: K) => V
  ): Partial<Record<K, V>> {
    const result: Partial<Record<K, V>> = {};

    for (const [key, value] of Object.entries(serialized)) {
      if (value !== undefined) {
        const enumKey = Number(key) as K;
        result[enumKey] = valueDeserializer(value as SerializedOf<V>, enumKey);
      }
    }

    return result;
  }

  static length(someEnum: NumericEnumLike) {
    const values = Object.values(someEnum).filter((v) => typeof v === "number");
    return values.length;
  }
}
