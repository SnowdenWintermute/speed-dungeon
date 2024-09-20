import { MAX_CRIT_CHANCE } from "../../../app_consts.js";
import { randBetween } from "../../../utils/index.js";

export default function rollCrit(critChancePercentage: number): boolean {
  const cappedCritChance = Math.min(MAX_CRIT_CHANCE, critChancePercentage);
  const roll = randBetween(0, 100);
  return roll < cappedCritChance;
}
