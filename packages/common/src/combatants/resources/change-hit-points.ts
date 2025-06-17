import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export function changeCombatantHitPoints(
  combatantProperties: CombatantProperties,
  hitPointChange: number
) {
  if (isNaN(hitPointChange)) throw new Error("hit point change was NaN");
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPoints = totalAttributes[CombatAttribute.Hp] || 0;
  console.log("max hit points:", maxHitPoints, "hit point change:", hitPointChange);
  const newHitPoints = Math.max(
    0,
    Math.min(maxHitPoints, combatantProperties.hitPoints + hitPointChange)
  );
  console.log("setting hit points to:", newHitPoints);
  combatantProperties.hitPoints = newHitPoints;
}
