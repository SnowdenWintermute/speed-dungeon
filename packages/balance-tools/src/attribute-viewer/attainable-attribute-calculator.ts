import {
  ClassProgressionProperties,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  IdGeneratorRandom,
  Username,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { BestPossibleEquipmentCollection } from "./best-possible-equipment-collection";
import { EquipmentByRequirementThresholds } from "./equipment-set-requirement-thresholds";
import { ThresholdEquipmentSetScores } from "./threshold-equipment-set-scores";

export interface MaxAttainableAttributeSpecification {
  attribute: CombatAttribute;
  mainClass: CombatantClass;
  supportClassOption: null | CombatantClass;
  level: number;
  specialty: CharacterWeaponSpecialty;
}

export class AttainableAttributeCalculator {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });

  getSortedEquipmentSetsWithAttributeScores(specification: MaxAttainableAttributeSpecification) {
    const bestEquipmentPerBaseItemSelector = new BestPossibleEquipmentCollection();

    const { attribute, mainClass, supportClassOption, level, specialty } = specification;

    const combatantBuilder = CombatantBuilder.playerCharacter(mainClass, "" as Username).level(
      level
    );

    if (supportClassOption !== null) {
      combatantBuilder.supportClass(
        supportClassOption,
        ClassProgressionProperties.maxSupportClassLevel(level)
      );
    }

    const combatant = combatantBuilder.build(this.idGenerator);

    const equipmentList =
      bestEquipmentPerBaseItemSelector.buildEquipmentOptionsForCombatantChasingAttribute(
        combatant,
        attribute
      );

    const equipmentThresholdSets = new EquipmentByRequirementThresholds(equipmentList);
    const thresholdEquipmentSetScores = new ThresholdEquipmentSetScores(
      combatant,
      specialty,
      attribute,
      equipmentThresholdSets
    ).getScoredSets();

    const toSort = [...thresholdEquipmentSetScores];
    const sorted = toSort.sort(
      ([thresholdA, equipmentSetA], [thresholdB, equipmentSetB]) =>
        equipmentSetB.score - equipmentSetA.score
    );

    return sorted;
  }
}
