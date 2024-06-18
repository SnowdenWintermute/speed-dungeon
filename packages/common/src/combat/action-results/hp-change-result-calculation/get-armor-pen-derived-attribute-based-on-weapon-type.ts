import { DEX_TO_RANGED_ARMOR_PEN_RATIO, STR_TO_MELEE_ARMOR_PEN_RATIO } from "../../../app_consts";
import { CombatAttribute, CombatantAttributeRecord } from "../../../combatants";
import { MeleeOrRanged } from "../../hp-change-source-types";

export default function getDerivedArmorPenAttributeBasedOnWeaponType(
  totalAttributes: CombatantAttributeRecord,
  meleeOrRanged: MeleeOrRanged
): number {
  switch (meleeOrRanged) {
    case MeleeOrRanged.Melee:
      return (totalAttributes[CombatAttribute.Strength] || 0) * STR_TO_MELEE_ARMOR_PEN_RATIO;
    case MeleeOrRanged.Ranged:
      return (totalAttributes[CombatAttribute.Dexterity] || 0) * DEX_TO_RANGED_ARMOR_PEN_RATIO;
    default:
      return 0;
  }
}
