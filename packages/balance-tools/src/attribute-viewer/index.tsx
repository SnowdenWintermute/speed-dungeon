import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import {
  AFFIX_CATEGORY_STRINGS,
  AFFIX_TYPE_STRINGS,
  ClassProgressionProperties,
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
    const bestEquipmentPerBaseItemSelector = new BestPossibleEquipmentCollection();

    const combatantLevel = 10;
    const chasedAttribute = CombatAttribute.Speed;
    const combatant = CombatantBuilder.playerCharacter(CombatantClass.Rogue, "" as Username)
      .level(combatantLevel)
      .supportClass(
        CombatantClass.Warrior,
        ClassProgressionProperties.maxSupportClassLevel(combatantLevel)
      )
      .build(new IdGeneratorSequential({ saveHistory: false }));

    const equipmentList =
      bestEquipmentPerBaseItemSelector.buildEquipmentOptionsForCombatantChasingAttribute(
        combatant,
        chasedAttribute
      );

    const equipmentThresholdSets = new EquipmentByRequirementThresholds(equipmentList);
    const thresholdEquipmentSetScores = new ThresholdEquipmentSetScores(
      combatant,
      CharacterWeaponSpecialty.DualWield,
      chasedAttribute,
      equipmentThresholdSets
    ).getScoredSets();

    const toSort = [...thresholdEquipmentSetScores];
    const sorted = toSort.sort(
      ([thresholdA, equipmentSetA], [thresholdB, equipmentSetB]) =>
        equipmentSetB.score - equipmentSetA.score
    );

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
