import {
  CONSUMABLE_TYPE_STRINGS,
  Consumable,
  ConsumableType,
  Item,
  randBetween,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { idGenerator, rngSingleton } from "../../singletons.js";

export function generateRandomItem(this: GameServer, itemLevel: number): Error | Item {
  const randomIndex = randBetween(
    0,
    Object.keys(this.itemGenerationDirectors).length - 1,
    rngSingleton
  );
  const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[randomIndex];
  // const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[
  //   EquipmentType.OneHandedMeleeWeapon
  // ];
  if (randomItemGenerationDirector === undefined)
    return new Error("no director found for that item type");

  let attempts = 0;

  // it is possible for no valid item to be available in certain item level ranges
  // so try 4 times to randomly get a valid one, else resort to an autoinjector
  let randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
  // let randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator, {
  //   forcedBaseItemOption: {
  //     type: ItemType.Equipment,
  //     baseItem: {
  //       equipmentType: EquipmentType.OneHandedMeleeWeapon,
  //       baseItemType: OneHandedMeleeWeapon.Club,
  //     },
  //   },
  // });
  while (attempts < 2 && randomItemResult instanceof Error) {
    randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
    attempts += 1;
  }
  if (randomItemResult instanceof Error) {
    console.info(
      `Couldn't find a valid item to generate, giving an autoinjector (${randomItemResult.message})`
    );
    const autoinjectorType =
      Math.random() > 0.3 ? ConsumableType.HpAutoinjector : ConsumableType.MpAutoinjector;

    return new Consumable(
      {
        id: idGenerator.generate(),
        name: CONSUMABLE_TYPE_STRINGS[autoinjectorType],
      },
      1,
      {},
      autoinjectorType,
      1
    );
  } else return randomItemResult;
}
