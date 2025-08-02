import { AdventuringParty, Consumable, Equipment, randBetween } from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { rngSingleton } from "../../../singletons.js";

export default function generateLoot(this: GameServer, party: AdventuringParty) {
  let equipment: Equipment[] = [];
  let consumables: Consumable[] = [];
  for (let i = 0; i < 3; i += 1) {
    const iLvl = randBetween(1, party.currentFloor, rngSingleton);
    const randomItem = this.generateRandomItem(iLvl);
    if (randomItem instanceof Error) console.error(randomItem);
    if (randomItem instanceof Consumable) consumables.push(randomItem);
    else if (randomItem instanceof Equipment) equipment.push(randomItem);
  }
  return { equipment, consumables };
}
