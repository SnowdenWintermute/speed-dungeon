import Divider from "@/app/components/atoms/Divider";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  Combatant,
  CombatantProperties,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common";
import React from "react";
import { AttributeListItem } from "./AttributeListItem";
import HpAndMp from "./HpAndMp";
import CharacterSheetWeaponDamage from "./CharacterSheetWeaponDamage";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { getCombatantClassIcon } from "@/utils/get-combatant-class-icon";

interface Props {
  combatant: Combatant;
  showAttributeAssignmentButtons: boolean;
}

export default function CharacterAttributes({ combatant, showAttributeAssignmentButtons }: Props) {
  const { entityProperties, combatantProperties } = combatant;
  const playerOwnsCharacter = clientUserControlsCombatant(entityProperties.id);

  const hasUnspentAttributePoints = combatantProperties.unspentAttributePoints > 0;
  const shouldShowNumberOfUnspentAttributes =
    hasUnspentAttributePoints &&
    combatantProperties.controllingPlayer !== null &&
    showAttributeAssignmentButtons;

  let expRequiredForNextLevel =
    typeof combatantProperties.experiencePoints.requiredForNextLevel === "number"
      ? combatantProperties.experiencePoints.requiredForNextLevel.toString()
      : "∞";
  let experiencePointsText =
    combatantProperties.controllingPlayer !== null
      ? `${combatantProperties.experiencePoints.current} / ${expRequiredForNextLevel} experience`
      : "";

  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  let totalAttributesSortedArray: [CombatAttribute, number][] = iterateNumericEnumKeyedRecord(
    totalAttributes
  ).map(([attribute, value]) => {
    return [attribute, value];
  });
  totalAttributesSortedArray = totalAttributesSortedArray.filter(
    ([attribute, _value]) => attribute !== CombatAttribute.Hp && attribute !== CombatAttribute.Mp
  );

  totalAttributesSortedArray.sort((a, b) => a[0] - b[0]);
  const numberOfAttributes = totalAttributesSortedArray.length;
  const halfNumberOfAttributes =
    numberOfAttributes % 2 === 0 ? numberOfAttributes / 2 : (numberOfAttributes - 1) / 2;

  const listItems = totalAttributesSortedArray.map(([attribute, value]) => (
    <AttributeListItem
      key={attribute}
      attribute={attribute}
      value={value}
      combatantHasUnspentAttributePoints={hasUnspentAttributePoints}
      playerOwnsCharacter={playerOwnsCharacter}
      showAttributeAssignmentButtonsIfOwned={showAttributeAssignmentButtons}
    />
  ));

  return (
    <div className="h-full w-[25.25rem] whitespace-nowrap">
      <div className="font-bold flex justify-between items-center">
        <span>
          {entityProperties.name}
          {` (${COMBATANT_CLASS_NAME_STRINGS[combatantProperties.combatantClass]})`}
        </span>
        <span className="h-10 w-10 flex justify-center rotate-45">
          {getCombatantClassIcon(
            combatantProperties.combatantClass,
            "fill-slate-400",
            "stroke-slate-400"
          )}
        </span>
      </div>
      <div className="flex justify-between">
        <span>
          {"Level "}
          {combatantProperties.level}{" "}
        </span>
        <span>{experiencePointsText}</span>
      </div>
      <Divider extraStyles={"mr-2 ml-2 "} />
      <div className="flex mb-1">
        {/*LEFT COLUMN*/}
        <ul className="list-none w-1/2 mr-1">
          {listItems.filter((_, i) => i < halfNumberOfAttributes)}
          {shouldShowNumberOfUnspentAttributes && (
            <li className="text-ffxipink flex justify-between">
              <span>Unspent: </span>
              <span>
                <span>{combatantProperties.unspentAttributePoints}</span>
              </span>
            </li>
          )}
        </ul>
        {/*RIGHT COLUMN*/}
        <ul className="list-none w-1/2 ml-1">
          {listItems.filter((_, i) => i >= halfNumberOfAttributes)}
        </ul>
      </div>
      <Divider extraStyles={"mr-2 ml-2 "} />
      <HpAndMp combatantProperties={combatantProperties} totalAttributes={totalAttributes} />
      <CharacterSheetWeaponDamage combatant={combatant} />
    </div>
  );
}
