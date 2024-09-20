import { CombatAttribute } from "./combat-attributes.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function setHpAndMpToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  if (typeof maxHpOption === "number") combatantProperties.hitPoints = maxHpOption;
  const maxMpOption = totalAttributes[CombatAttribute.Mp];
  if (typeof maxMpOption === "number") combatantProperties.mana = maxMpOption;
}
