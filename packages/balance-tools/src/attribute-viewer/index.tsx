import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { AttainableAttributeCalculator } from "./attainable-attribute-calculator";
import { CombatAttribute } from "@speed-dungeon/common";

export function AttributeViewer() {
  function handleClick() {
    const attainableAttributeCalculator = new AttainableAttributeCalculator(
      CombatAttribute.Strength
    );
    attainableAttributeCalculator.createAllEquipmentWithMaxRolls();
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
