import { CombatantProperties, DEEPEST_FLOOR, randBetween } from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export default function generateTestItems(combatantProperties: CombatantProperties, num: number) {
  for (let i = 0; i < num; i += 1) {
    const iLvl = randBetween(1, DEEPEST_FLOOR);
    const randomItem = getGameServer().generateRandomItem(1);
    if (!(randomItem instanceof Error)) combatantProperties.inventory.items.push(randomItem);
  }
}
