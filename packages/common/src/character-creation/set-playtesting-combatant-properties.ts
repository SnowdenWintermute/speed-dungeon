import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { CombatantActionState } from "../combatants/owned-actions/combatant-action-state.js";

export function setPlaytestingCombatantProperties(combatantProperties: CombatantProperties) {
  const { classProgressionProperties } = combatantProperties;
  // classProgressionProperties.experiencePoints.changeExperience(2000);
  classProgressionProperties.awardLevelups();

  // combatantProperties.attributeProperties.setSpeccedAttributeValue(CombatAttribute.Strength, 30);
  // combatantProperties.attributeProperties.setSpeccedAttributeValue(CombatAttribute.Spirit, 30);
  combatantProperties.abilityProperties.setOwnedAction(
    new CombatantActionState(CombatActionName.IceBoltParent, 1)
  );
  combatantProperties.abilityProperties.setOwnedAction(
    new CombatantActionState(CombatActionName.ChainingSplitArrowParent, 3)
  );
  combatantProperties.abilityProperties.setOwnedAction(
    new CombatantActionState(CombatActionName.Fire, 3)
  );
  combatantProperties.abilityProperties.setOwnedAction(
    new CombatantActionState(CombatActionName.Healing, 3)
  );
  // combatantProperties.attributeProperties.changeUnspentPoints(30);
}
