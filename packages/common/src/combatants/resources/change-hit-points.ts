import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function changeCombatantHitPoints(
  combatantProperties: CombatantProperties,
  hitPointChange: number
) {
  if (isNaN(hitPointChange)) throw new Error("hit point change was NaN");
  const totalAttributes = combatantProperties.getTotalAttributes();
  const maxHitPoints = totalAttributes[CombatAttribute.Hp] || 0;
  const newHitPoints = Math.max(
    0,
    Math.min(maxHitPoints, combatantProperties.hitPoints + hitPointChange)
  );
  combatantProperties.hitPoints = newHitPoints;
}
