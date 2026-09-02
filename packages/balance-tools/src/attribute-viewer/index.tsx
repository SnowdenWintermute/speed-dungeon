import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import {
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  IdGeneratorSequential,
  Username,
} from "@speed-dungeon/common";
import { BestPossibleEquipmentCollection } from "./best-possible-equipment-collection";
import { EquipmentByRequirementThresholds } from "./equipment-set-requirement-thresholds";

export function AttributeViewer() {
  function handleClick() {
    // const attainableAttributeCalculator = new AttainableAttributeCalculator().getMaxAttainable(
    //   CombatantClass.Warrior,
    //   CombatantClass.Rogue,
    //   CharacterWeaponSpecialty.Shields,
    //   CombatAttribute.Strength
    // );

    const bestEquipmentPerBaseItemSelector = new BestPossibleEquipmentCollection();
    const equipmentList =
      bestEquipmentPerBaseItemSelector.buildEquipmentOptionsForCombatantChasingAttribute(
        CombatantBuilder.playerCharacter(CombatantClass.Warrior, "" as Username).build(
          new IdGeneratorSequential({ saveHistory: false })
        ),
        CombatAttribute.Spirit
      );

    const equipmentThresholdSets = new EquipmentByRequirementThresholds(equipmentList)
      .equipmentByRequirementThreshold;
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
