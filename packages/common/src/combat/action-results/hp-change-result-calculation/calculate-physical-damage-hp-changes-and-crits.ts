import { HpChange } from "./index.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import { BASE_CRIT_CHANCE } from "../../../app-consts.js";
import { MeleeOrRanged } from "../../hp-change-source-types.js";
import applyAffinityToHpChange from "./apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import rollCrit from "./roll-crit.js";
import getDamageAfterArmorClass from "./get-damage-after-armor-class.js";

export default function calculatePhysicalDamageHpChangesAndCrits(
  game: SpeedDungeonGame,
  meleeOrRanged: MeleeOrRanged,
  userCombatantProperties: CombatantProperties,
  idsOfNonEvadingTargets: string[],
  incomingDamagePerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
): Error | { [entityId: string]: HpChange } {
  const hitPointChanges: { [entityId: string]: HpChange } = {};

  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  for (const targetId of idsOfNonEvadingTargets) {
    const hpChange = new HpChange(incomingDamagePerTarget, hpChangeProperties.hpChangeSource);
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
    const targetCombatAttributes =
      CombatantProperties.getTotalAttributes(targetCombatantProperties);

    // determine crits
    const userDexterity = userCombatAttributes[CombatAttribute.Dexterity] || 0;
    const targetAgility = targetCombatAttributes[CombatAttribute.Agility] || 0;
    const critChance = userDexterity - targetAgility + BASE_CRIT_CHANCE;
    const isCrit = rollCrit(critChance);
    if (isCrit) {
      hpChange.value = applyCritMultiplierToHpChange(
        hpChangeProperties,
        userCombatAttributes,
        hpChange.value
      );
      hpChange.isCrit = true;
    }

    const hpChangeElement = hpChangeProperties.hpChangeSource.elementOption;
    if (hpChangeElement !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[hpChangeElement] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }
    const kineticDamageType = hpChangeProperties.hpChangeSource.kineticDamageTypeOption;
    if (kineticDamageType !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[kineticDamageType] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }

    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    const damageAfterAc = getDamageAfterArmorClass(
      hpChange.value,
      userCombatAttributes,
      targetCombatAttributes,
      meleeOrRanged
    );
    hpChange.value = damageAfterAc;

    // since "damage" is written as positive numbers in the action definitions
    // we convert to a negative value as the "hp change"
    hpChange.value *= -1;
    hitPointChanges[targetId] = hpChange;
  }

  return hitPointChanges;
}
