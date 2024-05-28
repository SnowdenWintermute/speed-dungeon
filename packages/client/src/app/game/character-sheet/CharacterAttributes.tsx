import CombatantClassIcon from "@/app/components/atoms/CombatantClassIcon";
import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  CombatantProperties,
  ERROR_MESSAGES,
  EntityProperties,
  formatCombatantClassName,
} from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common/src/combatants/combat-attributes";
import React from "react";
import { AttributeListItem } from "./AttributeListItem";
import HpAndMp from "./HpAndMp";
import CharacterSheetWeaponDamage from "./CharacterSheetWeaponDamage";

interface Props {
  combatantProperties: CombatantProperties;
  entityProperties: EntityProperties;
  showAttributeAssignmentButtons: boolean;
}

export default function CharacterAttributes({
  combatantProperties,
  entityProperties,
  showAttributeAssignmentButtons,
}: Props) {
  const username = useLobbyStore().username;
  if (!username) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const gameOption = useGameStore().game;
  if (!gameOption) return <div>{ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME}</div>;
  const playerOption = gameOption.players[username];
  if (!playerOption) return <div>{ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST}</div>;
  const playerOwnsCharacter = Object.keys(playerOption.characterIds).includes(entityProperties.id);

  const hasUnspentAttributePoints = combatantProperties.unspentAbilityPoints > 0;
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
  const totalAttributesSortedArray: [CombatAttribute, number][] = Object.entries(
    totalAttributes
  ).map(([key, value]) => {
    const attribute = parseInt(key) as CombatAttribute;
    return [attribute, value];
  });
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
    <div className="h-full w-[24.25rem] whitespace-nowrap">
      <div className="font-bold flex justify-between items-center">
        <span>
          {entityProperties.name}
          {` (${formatCombatantClassName(combatantProperties.combatantClass)})`}
        </span>
        <span className="h-10 w-10 p-1 flex justify-center rotate-45">
          <CombatantClassIcon combatantClass={combatantProperties.combatantClass} />
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
              <span>"Unspent: "</span>
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
      <CharacterSheetWeaponDamage combatantProperties={combatantProperties} />
    </div>
  );
}
