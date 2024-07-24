import {
  ConsumableProperties,
  ConsumableType,
  IdGenerator,
  Item,
  ItemPropertiesType,
  formatConsumableType,
  randBetween,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export function generateRandomItem(
  this: GameServer,
  itemLevel: number,
  idGenerator: IdGenerator
): Error | Item {
  const randomIndex = randBetween(0, Object.keys(this.itemGenerationDirectors).length - 1);
  const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[randomIndex];
  if (randomItemGenerationDirector === undefined)
    return new Error("no director found for that item type");

  let attempts = 0;

  let randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
  while (attempts < 4 && randomItemResult instanceof Error) {
    randomItemResult = randomItemGenerationDirector.createItem(itemLevel, idGenerator);
    attempts += 1;
  }
  if (randomItemResult instanceof Error) {
    console.log("Couldn't find a valid item to generate, giving an autoinjector");
    console.log(randomItemResult);
    return new Item(
      {
        id: idGenerator.getNextEntityId(),
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
