import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { getPreEquipmentChangeHpAndManaPercentage } from "./get-pre-equipment-change-hp-and-mana-percentage.js";

/** When equipping/unequipping armor, breaking, or sharding an equipped item, HP and MP
 *  current values should remain at their same percentages
 * */
export function applyEquipmentEffectWhileMaintainingResourcePercentages(
  combatantProperties: CombatantProperties,
  effect: () => void
) {
  const { percentOfMaxHitPoints, percentOfMaxMana } =
    getPreEquipmentChangeHpAndManaPercentage(combatantProperties);

  effect();

  const attributesAfter = combatantProperties.getTotalAttributes();
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);
}
