import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import {
  AFFIX_CATEGORY_STRINGS,
  AFFIX_TYPE_STRINGS,
  COMBATANT_MAX_LEVEL,
  CombatantClass,
  CombatAttribute,
  EQUIPMENT_SLOT_ID_STRINGS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { useState } from "react";
import { AttainableAttributeCalculator } from "./attainable-attribute-calculator";
import { ScoredEquipmentSet } from "./threshold-equipment-set-scores";

export function AttributeViewer() {
  const [sorted, setSorted] = useState<ScoredEquipmentSet[]>([]);

  function handleClick() {
    const sorted = new AttainableAttributeCalculator().getSortedEquipmentSetsWithAttributeScores({
      attribute: CombatAttribute.Speed,
      buildSpec: {
        mainClass: CombatantClass.Rogue,
        supportClass: CombatantClass.Warrior,
        weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
      },
      level: COMBATANT_MAX_LEVEL,
    });

    console.log("sorted count:", sorted.length);

    setSorted(sorted);
  }

  return (
    <div>
      AttributeViewer
      <div>
        <ButtonBasic onClick={handleClick}>click me</ButtonBasic>
      </div>
      <ul className="w-full">
        {sorted.map(({ set, score }, setIndex) => {
          return (
            <li className="w-full" key={setIndex}>
              <div>Score:{score}</div>
              <div className="w-full">
                {iterateNumericEnumKeyedRecord(set).map(([slotId, equipment]) => {
                  return (
                    <div className="flex justify-between w-full border" key={slotId}>
                      <div>{EQUIPMENT_SLOT_ID_STRINGS[slotId]}</div>
                      <div>{equipment.entityProperties.name}</div>
                      <div>
                        {iterateNumericEnumKeyedRecord(equipment.affixes).map(
                          ([affixCategory, affixes]) => (
                            <div key={affixCategory}>
                              <div>{AFFIX_CATEGORY_STRINGS[affixCategory]}</div>
                              <div>
                                {iterateNumericEnumKeyedRecord(affixes).map(
                                  ([affixType, affix]) => (
                                    <div key={affixType}>
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
