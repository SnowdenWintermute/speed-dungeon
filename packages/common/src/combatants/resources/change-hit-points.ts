import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export default function changeCombatantHitPoints(
  combatantProperties: CombatantProperties,
  hitPointChange: number
) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPoints = totalAttributes[CombatAttribute.Hp] || 0;
  combatantProperties.hitPoints = Math.max(
    0,
    Math.min(maxHitPoints, combatantProperties.hitPoints + hitPointChange)
  );
}
