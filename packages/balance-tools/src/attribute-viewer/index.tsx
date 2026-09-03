import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import {
  AFFIX_CATEGORY_STRINGS,
  AFFIX_TYPE_STRINGS,
  ClassProgressionProperties,
  COMBATANT_MAX_LEVEL,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  Equipment,
  EQUIPMENT_SLOT_ID_STRINGS,
  EquipmentSlotId,
  IdGeneratorSequential,
  iterateNumericEnumKeyedRecord,
  Username,
} from "@speed-dungeon/common";
import { BestPossibleEquipmentCollection } from "./best-possible-equipment-collection";
import { EquipmentByRequirementThresholds } from "./equipment-set-requirement-thresholds";
import { ThresholdEquipmentSetScores } from "./threshold-equipment-set-scores";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { useState } from "react";
import { AttainableAttributeCalculator } from "./attainable-attribute-calculator";

export function AttributeViewer() {
  const [sorted, setSorted] = useState<
    [
      Partial<Record<CombatAttribute, number>>,
      {
        set: Partial<Record<EquipmentSlotId, Equipment>>;
        score: number;
      },
    ][]
  >([]);

  function handleClick() {
    const sorted = new AttainableAttributeCalculator().getSortedEquipmentSetsWithAttributeScores({
      mainClass: CombatantClass.Rogue,
      supportClassOption: CombatantClass.Warrior,
      attribute: CombatAttribute.Speed,
      level: COMBATANT_MAX_LEVEL,
      specialty: CharacterWeaponSpecialty.TwoHandedMelee,
    });
    setSorted(sorted);
  }

  return (
    <div>
      AttributeViewer
      <div>
        <ButtonBasic onClick={handleClick}>click me</ButtonBasic>
      </div>
      <ul className="w-full">
        {sorted.map(([threshold, { set, score }]) => {
          return (
            <li className="w-full">
              <div>Score:{score}</div>
              <div className="w-full">
                {iterateNumericEnumKeyedRecord(set).map(([slotId, equipment]) => {
                  return (
                    <div className="flex justify-between w-full border">
                      <div>{EQUIPMENT_SLOT_ID_STRINGS[slotId]}</div>
                      <div>{equipment.entityProperties.name}</div>
                      <div>
                        {iterateNumericEnumKeyedRecord(equipment.affixes).map(
                          ([affixCategory, affixes]) => (
                            <div>
                              <div>{AFFIX_CATEGORY_STRINGS[affixCategory]}</div>
                              <div>
                                {iterateNumericEnumKeyedRecord(affixes).map(
                                  ([affixType, affix]) => (
                                    <div>
                                      <div>{AFFIX_TYPE_STRINGS[affixType]}</div>
                                      <div>{affix.tier}</div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
