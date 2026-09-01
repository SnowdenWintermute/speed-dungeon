import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { AttainableAttributeCalculator } from "./attainable-attribute-calculator";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  CombatantClass,
  CombatAttribute,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";

export function AttributeViewer() {
  function handleClick() {
    const attainableAttributeCalculator = new AttainableAttributeCalculator().getMaxAttainable(
      CombatantClass.Warrior,
      CombatantClass.Rogue,
      CharacterWeaponSpecialty.Shields,
      CombatAttribute.Strength
    );

    for (const [attribute, value] of iterateNumericEnumKeyedRecord(attainableAttributeCalculator)) {
      console.log(COMBAT_ATTRIBUTE_STRINGS[attribute], value);
    }
  }

  return (
    <div>
      AttributeViewer
      <div>
        <ButtonBasic onClick={handleClick}>click me</ButtonBasic>
      </div>
    </div>
  );
}
