import { CombatAttribute } from "./combat-attributes";
import { CombatantProperties } from "./combatant-properties";

export default function setHpAndMpToMax(this: CombatantProperties) {
  const totalAttributes = this.getTotalAttributes();
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  if (typeof maxHpOption === "number") this.hitPoints = maxHpOption;
  const maxMpOption = totalAttributes[CombatAttribute.Mp];
  if (typeof maxMpOption === "number") this.mana = maxMpOption;
}
