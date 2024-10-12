import {
  ConsumableProperties,
  ConsumableType,
  Item,
  ItemPropertiesType,
  formatConsumableType,
  randBetween,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { idGenerator } from "../../singletons.js";

export function generateRandomItem(this: GameServer, itemLevel: number): Error | Item {
  const randomIndex = randBetween(0, Object.keys(this.itemGenerationDirectors).length - 1);
  const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[randomIndex];
  if (randomItemGenerationDirector === undefined)
    return new Error("no director found for that item type");

  let attempts = 0;

  // it is possible for no valid item to be available in certain item level ranges
  // so try 4 times to randomly get a valid one, else resort to an autoinjector
  let randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
  while (attempts < 4 && randomItemResult instanceof Error) {
    randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
    attempts += 1;
  }
  if (randomItemResult instanceof Error) {
    console.log(
      `Couldn't find a valid item to generate, giving an autoinjector (${randomItemResult.message})`
    );
    return new Item(
      {
        id: idGenerator.generate(),
        name: formatConsumableType(ConsumableType.HpAutoinjector),
      },
      1,
      {},
      {
        type: ItemPropertiesType.Consumable,
        consumableProperties: new ConsumableProperties(ConsumableType.HpAutoinjector, 1),
      }
    );
  } else return randomItemResult;
}
