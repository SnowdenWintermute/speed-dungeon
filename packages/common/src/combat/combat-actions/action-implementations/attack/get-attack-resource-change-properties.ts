import { IActionUser } from "../../../../action-user-context/action-user.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
import { applyWeaponPropertiesToResourceChangeProperties } from "../../action-calculation-utils/apply-weapon-properties-to-hp-change-properties.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";

export function getAttackResourceChangeProperties(
  user: IActionUser,
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  actionLevel: number,
  primaryTarget: CombatantProperties,
  scalingAttribute: CombatAttribute,
  options = { usableWeaponsOnly: true, forceUnarmed: false }
) {
  const weaponSlot = hitOutcomeProperties.addsPropertiesFromHoldableSlot;

  const hpChangeSourceConfig: ResourceChangeSourceConfig = {
    category: ResourceChangeSourceCategory.Physical,
    kineticDamageTypeOption: null,
    elementOption: null,
    isHealing: false,
    lifestealPercentage: null,
  };

  const baseValues = new NumberRange(1, 1);

  // just get some extra damage for combatant level
  baseValues.add(user.getLevel() - 1);
  // get greater benefits from a certain attribute the higher level a combatant is
  addCombatantLevelScaledAttributeToRange({
    range: baseValues,
    userTotalAttributes: user.getTotalAttributes(),
    userLevel: user.getLevel(),
    attribute: scalingAttribute,
    normalizedAttributeScalingByCombatantLevel: 1,
  });

  const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
  const hpChangeProperties: CombatActionResourceChangeProperties = {
    resourceChangeSource,
    baseValues,
  };

  const equippedUsableWeapons = user.getWeaponsInSlots(
    [HoldableSlotType.MainHand, HoldableSlotType.OffHand],
    { usableWeaponsOnly: options.usableWeaponsOnly }
  );

  const weaponOption = weaponSlot !== null ? equippedUsableWeapons[weaponSlot] : null;

  if (weaponOption && !options.forceUnarmed) {
    applyWeaponPropertiesToResourceChangeProperties(
      hitOutcomeProperties,
      weaponOption,
      hpChangeProperties,
      user,
      1,
      primaryTarget
    );
  } else {
    // unarmed
    hpChangeProperties.resourceChangeSource.kineticDamageTypeOption = KineticDamageType.Blunt;
  }

  // lifesteal on the swung weapon is handled per-weapon above; here we add lifesteal granted by the
  // wearer's other equipment (jewelry, armor, shield) so it applies to every attack they make
  const equipmentOption = user.getEquipmentOption();
  if (equipmentOption) {
    for (const equippedItem of equipmentOption.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    })) {
      if (equippedItem.isWeapon()) continue;
      const maybeError = equippedItem.applyTraitsToResourceChangeSource(
        hpChangeProperties.resourceChangeSource
      );
      if (maybeError instanceof Error) console.error(maybeError);
    }
  }

  baseValues.floor(1);

  return hpChangeProperties;
}
