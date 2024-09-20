import { AdventuringParty, Item, SpeedDungeonGame, randBetween } from "@speed-dungeon/common";
import { GameServer } from "../../index.js";

export default function generateLoot(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
) {
  let items: Item[] = [];
  for (let i = 0; i < 3; i += 1) {
    const iLvl = randBetween(1, party.currentFloor);
    const randomItem = this.generateRandomItem(iLvl, game.idGenerator);
    if (!(randomItem instanceof Error)) {
      items.push(randomItem);
    }
  }
  return items;
}
