import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export default function setResourcesToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  if (typeof maxHpOption === "number") combatantProperties.hitPoints = maxHpOption;
  const maxMpOption = totalAttributes[CombatAttribute.Mp];
  if (typeof maxMpOption === "number") combatantProperties.mana = maxMpOption;
  else combatantProperties.mana = 0;
}
