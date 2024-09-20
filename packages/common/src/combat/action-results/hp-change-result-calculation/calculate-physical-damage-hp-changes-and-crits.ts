import { ValueChangesAndCrits } from "./index.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import { ARMOR_CLASS_EQUATION_MODIFIER, BASE_CRIT_CHANCE } from "../../../app_consts.js";
import { MeleeOrRanged } from "../../hp-change-source-types.js";
import applyAffinityToHpChange from "./apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import getDerivedArmorPenAttributeBasedOnWeaponType from "./get-armor-pen-derived-attribute-based-on-weapon-type.js";
import rollCrit from "./roll-crit.js";

export default function calculatePhysicalDamageHpChangesAndCrits(
  game: SpeedDungeonGame,
  meleeOrRanged: MeleeOrRanged,
  userCombatantProperties: CombatantProperties,
  idsOfNonEvadingTargets: string[],
  incomingDamagePerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
): Error | ValueChangesAndCrits {
  const hitPointChanges: { [entityId: string]: number } = {};
  const entitiesCrit: string[] = [];

  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  for (const targetId of idsOfNonEvadingTargets) {
    let hpChange = incomingDamagePerTarget;
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
      hpChange = applyCritMultiplierToHpChange(hpChangeProperties, userCombatAttributes, hpChange);
      entitiesCrit.push(targetId);
    }

    const targetAc = targetCombatAttributes[CombatAttribute.ArmorClass] || 0;
    let userArmorPen = userCombatAttributes[CombatAttribute.ArmorPenetration] || 0;
    const armorPenBonusBasedOnWeaponType = getDerivedArmorPenAttributeBasedOnWeaponType(
      userCombatAttributes,
      meleeOrRanged
    );
    userArmorPen += armorPenBonusBasedOnWeaponType;
    const finalAc = Math.max(0, targetAc - userArmorPen);
    const damageAfterAc =
      (ARMOR_CLASS_EQUATION_MODIFIER * Math.pow(hpChange, 2.0)) /
      (finalAc + ARMOR_CLASS_EQUATION_MODIFIER * hpChange);
    hpChange = damageAfterAc;

    const hpChangeElement = hpChangeProperties.sourceProperties.elementOption;
    if (hpChangeElement !== null) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[hpChangeElement] || 0;
      hpChange = applyAffinityToHpChange(affinityValue, hpChange);
    }
    const physicalDamageType = hpChangeProperties.sourceProperties.physicalDamageTypeOption;
    if (physicalDamageType !== null) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalPhysicalDamageTypeAffinities(
          targetCombatantProperties
        );
      const affinityValue = targetAffinities[physicalDamageType] || 0;
      hpChange = applyAffinityToHpChange(affinityValue, hpChange);
    }

    hpChange *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // since "damage" is written as positive numbers in the action definitions
    // we convert to a negative value as the "hp change"
    hpChange *= -1;
    hitPointChanges[targetId] = hpChange;
  }

  return {
    valueChangesByEntityId: hitPointChanges,
    entityIdsCrit: entitiesCrit,
  };
}
