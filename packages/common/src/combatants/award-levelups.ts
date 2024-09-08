import { CombatantProperties } from "../combatants";
import { COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL } from "../combatants/combatant-class/class-attributes-by-level";
import { iterateNumericEnumKeyedRecord } from "../utils";

const XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT = 25;
const ABILITY_POINTS_AWARDED_PER_LEVEL = 2;
const ATTRIBUTE_POINTS_AWARDED_PER_LEVEL = 5;

export default function awardLevelups(combatantProperties: CombatantProperties) {
  let calculatingNewLevelups = true;
  while (calculatingNewLevelups) {
    const { requiredForNextLevel } = combatantProperties.experiencePoints;
    if (
      requiredForNextLevel === null ||
      combatantProperties.experiencePoints.current < requiredForNextLevel
    ) {
      calculatingNewLevelups = false;
      break;
    }

    combatantProperties.level += 1;
    // ADD TO INHERENT ATTRIBUTES
    const classAttributes = COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[combatantProperties.combatantClass];

    for (const [attribute, value] of iterateNumericEnumKeyedRecord(classAttributes)) {
      if (combatantProperties.inherentAttributes[attribute] === undefined)
        combatantProperties.inherentAttributes[attribute] = 0;
      combatantProperties.inherentAttributes[attribute]! += value;
    }

    combatantProperties.unspentAbilityPoints += ABILITY_POINTS_AWARDED_PER_LEVEL;
    combatantProperties.unspentAttributePoints += ATTRIBUTE_POINTS_AWARDED_PER_LEVEL;
    combatantProperties.experiencePoints.current -= requiredForNextLevel;

    CombatantProperties.setHpAndMpToMax(combatantProperties);

    combatantProperties.experiencePoints.requiredForNextLevel =
      requiredForNextLevel + XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT;
  }
}
