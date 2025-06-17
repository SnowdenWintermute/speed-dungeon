import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export function setResourcesToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  console.log("setting resources to max (hp)", maxHpOption);
  if (typeof maxHpOption === "number" && !isNaN(maxHpOption))
    combatantProperties.hitPoints = maxHpOption;
  const maxMpOption = totalAttributes[CombatAttribute.Mp];
  if (typeof maxMpOption === "number" && !isNaN(maxMpOption))
    combatantProperties.mana = maxMpOption;
  else combatantProperties.mana = 0;
}
