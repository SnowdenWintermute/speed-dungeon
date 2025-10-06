import { AdventuringParty, Consumable, Equipment, randBetween } from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { rngSingleton } from "../../../singletons/index.js";

export function generateLoot(this: GameServer, party: AdventuringParty) {
  let equipment: Equipment[] = [];
  let consumables: Consumable[] = [];
  for (let i = 0; i < 3; i += 1) {
    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
    const iLvl = randBetween(1, floorNumber, rngSingleton);
    const randomItem = this.generateRandomItem(iLvl);
    if (randomItem instanceof Error) console.error(randomItem);
    if (randomItem instanceof Consumable) consumables.push(randomItem);
    else if (randomItem instanceof Equipment) equipment.push(randomItem);
  }
  return { equipment, consumables };
}
