import { BASE_CRIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import getHealingHpChangeOnTargetCombatant from "./get-healing-hp-change-on-target-combatant.js";
import { HpChange } from "./index.js";
import rollCrit from "./roll-crit.js";

export default function calculateHealingHpChangesAndCrits(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  targetIds: string[],
  incomingHealingPerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
) {
  const hitPointChanges: { [entityId: string]: HpChange } = {};
  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  const hpChange = new HpChange(incomingHealingPerTarget, hpChangeProperties.hpChangeSource);
  // calculate crit by action instead of per entity for
  // healing because there is no per entity "crit resistance" for healing
  const userFocus = userCombatAttributes[CombatAttribute.Focus] || 0;
  const critChance = userFocus + BASE_CRIT_CHANCE;
  const isCrit = rollCrit(critChance);

  if (isCrit) {
    hpChange.value = applyCritMultiplierToHpChange(
      hpChangeProperties,
      userCombatAttributes,
      incomingHealingPerTarget
    );
    hpChange.isCrit = true;
  }

  for (const targetId of targetIds) {
    const hpChangeResult = getHealingHpChangeOnTargetCombatant(game, targetId, hpChange.value);
    if (hpChangeResult instanceof Error) return hpChangeResult;
    hpChange.value = hpChangeResult;
    hitPointChanges[targetId] = hpChange;
  }

  return hitPointChanges;
}
