import { iterateNumericEnumKeyedRecord } from "./index.js";
import { Serializable, SerializedOf } from "../serialization/index.js";

export class NumericEnumUtils {
  static serializeNumericEnumRecord<K extends number, V extends Serializable>(
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
}
