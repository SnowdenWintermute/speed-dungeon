import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function changeCombatantHitPoints(
  combatantProperties: CombatantProperties,
  hitPointChange: number
) {
  if (isNaN(hitPointChange)) throw new Error("hit point change was NaN");
  const maxHitPoints = combatantProperties.attributeProperties.getAttributeValue(
    CombatAttribute.Hp
  );
  const newHitPoints = Math.max(
    0,
    Math.min(maxHitPoints, combatantProperties.hitPoints + hitPointChange)
  );
  combatantProperties.hitPoints = newHitPoints;
}
