import { BASE_CRIT_CHANCE } from "../../../app_consts";
import { CombatAttribute, CombatantProperties } from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionHpChangeProperties } from "../../combat-actions";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change";
import getHealingHpChangeOnTargetCombatant from "./get-healing-hp-change-on-target-combatant";
import rollCrit from "./roll-crit";

export default function calculateHealingHpChangesAndCrits(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  targetIds: string[],
  incomingHealingPerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
) {
  const hitPointChanges: { [entityId: string]: number } = {};
  let entitiesCrit: string[] = [];
  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  let hpChangeInitial = incomingHealingPerTarget;
  // calculate crit by action instead of per entity for
  // healing because there is no per entity "crit resistance" for healing
  const userFocus = userCombatAttributes[CombatAttribute.Focus] || 0;
  const critChance = userFocus + BASE_CRIT_CHANCE;
  const isCrit = rollCrit(critChance);

  if (isCrit) {
    hpChangeInitial = applyCritMultiplierToHpChange(
      hpChangeProperties,
      userCombatAttributes,
      incomingHealingPerTarget
    );
    entitiesCrit = targetIds;
  }

  for (const targetId of targetIds) {
    const hpChangeResult = getHealingHpChangeOnTargetCombatant(game, targetId, hpChangeInitial);
    if (hpChangeResult instanceof Error) return hpChangeResult;
    hitPointChanges[targetId] = hpChangeResult;
  }

  return {
    valueChangesByEntityId: hitPointChanges,
    entityIdsCrit: entitiesCrit,
  };
}
