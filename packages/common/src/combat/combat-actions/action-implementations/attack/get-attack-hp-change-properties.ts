import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { NumberRange } from "../../../../primatives/index.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/hp-change-evasion-and-durability-change-result-calculation/add-combatant-level-scaled-attribute-to-range.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  HpChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { applyWeaponPropertiesToHpChangeProperties } from "../../action-calculation-utils/apply-weapon-properties-to-hp-change-properties.js";
import { CombatActionHpChangeProperties } from "../../combat-action-hp-change-properties.js";

export function getAttackHpChangeProperties(
  user: CombatantProperties,
  primaryTarget: CombatantProperties,
  scalingAttribute: CombatAttribute,
  weaponSlot: HoldableSlotType
) {
  const hpChangeSourceConfig: HpChangeSourceConfig = {
    category: HpChangeSourceCategory.Physical,
    kineticDamageTypeOption: null,
    elementOption: null,
    isHealing: false,
    lifestealPercentage: null,
  };

  const baseValues = new NumberRange(1, 1);

  // just get some extra damage for combatant level
  baseValues.add(user.level);
  // get greater benefits from a certain attribute the higher level a combatant is
  addCombatantLevelScaledAttributeToRange({
    range: baseValues,
    combatantProperties: user,
    attribute: scalingAttribute,
    normalizedAttributeScalingByCombatantLevel: 1,
  });

  const hpChangeSource = new HpChangeSource(hpChangeSourceConfig);
  const hpChangeProperties: CombatActionHpChangeProperties = {
    hpChangeSource,
    baseValues,
  };

  const equippedUsableWeaponsResult = CombatantProperties.getUsableWeaponsInSlots(user, [
    HoldableSlotType.MainHand,
  ]);
  if (equippedUsableWeaponsResult instanceof Error)
    return new Error(equippedUsableWeaponsResult.stack);
  const equippedUsableWeapons = equippedUsableWeaponsResult;

  const weaponOption = equippedUsableWeapons[weaponSlot];
  if (weaponOption)
    applyWeaponPropertiesToHpChangeProperties(
      weaponOption,
      hpChangeProperties,
      user,
      primaryTarget
    );

  baseValues.floor();

  return hpChangeProperties;
}
