import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function setResourcesToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  if (isNaN(maxHpOption)) throw new Error("unexpected NaN");
  if (typeof maxHpOption === "number") combatantProperties.hitPoints = maxHpOption;
  const maxMpOption = totalAttributes[CombatAttribute.Mp];
  if (isNaN(maxMpOption)) throw new Error("unexpected NaN");
  if (typeof maxMpOption === "number") combatantProperties.mana = maxMpOption;
  else combatantProperties.mana = 0;
}
