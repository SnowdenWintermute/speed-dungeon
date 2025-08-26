import { CONSUMABLE_TYPE_STRINGS, Consumable, ConsumableType } from "@speed-dungeon/common";
import { idGenerator } from "../../singletons/index.js";

export function createConsumableByType(consumableType: ConsumableType) {
  return new Consumable(
    {
      name: CONSUMABLE_TYPE_STRINGS[consumableType],
      id: idGenerator.generate(),
    },
    1,
    {},
    consumableType,
    1
  );
}
