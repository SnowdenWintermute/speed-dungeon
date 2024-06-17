import { MIN_HIT_CHANCE } from "../../../app_consts";
import {
  CombatAttribute,
  CombatantAttributeRecord,
  CombatantProperties,
} from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { randBetween } from "../../../utils";

export default function getIdsOfEvadingEntities(
  game: SpeedDungeonGame,
  userCombatantAttributes: CombatantAttributeRecord,
  targetIds: string[]
): Error | string[] {
  const idsOfEvadingEntities = [];

  for (const targetId of targetIds) {
    const userAccuracy = userCombatantAttributes[CombatAttribute.Accuracy] || 0;
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
    const targetCombatantAttributes =
      CombatantProperties.getTotalAttributes(targetCombatantProperties);
    const targetEvasion = targetCombatantAttributes[CombatAttribute.Evasion] || 0;
    const accComparedToEva = userAccuracy - targetEvasion;
    const percentChangeToHit = Math.max(MIN_HIT_CHANCE, accComparedToEva);
    const evasionRoll = randBetween(0, 100);
    if (evasionRoll > percentChangeToHit) idsOfEvadingEntities.push(targetId);
  }

  return idsOfEvadingEntities;
}
