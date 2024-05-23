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
import React from "react";

interface Props {
  combatantProperties: CombatantProperties;
  entityProperties: EntityProperties;
  showAttributeAssignmentButton: boolean;
}

export default function CharacterAttributes({
  combatantProperties,
  entityProperties,
  showAttributeAssignmentButton,
}: Props) {
  const username = useLobbyStore().username;
  if (!username) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const gameOption = useGameStore().game;
  if (!gameOption) return <div>{ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME}</div>;
  const playerOption = gameOption.players[username];
  if (!playerOption) return <div>{ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST}</div>;
  const playerOwnsCharacter = Object.keys(playerOption.characterIds).includes(entityProperties.id);

  let expRequiredForNextLevel =
    typeof combatantProperties.experiencePoints.requiredForNextLevel === "number"
      ? combatantProperties.experiencePoints.requiredForNextLevel.toString()
      : "∞";
  let experiencePointsText =
    combatantProperties.controllingPlayer !== null
      ? `${combatantProperties.experiencePoints.current} / ${expRequiredForNextLevel} experience`
      : "";

  const totalAttributes = combatantProperties.getTotalAttributes();

  return (
    <div className="h-full w-[24.25rem] whitespace-nowrap">
      <div className="font-bold flex justify-between items-center">
        <span>
          {entityProperties.name}
          {formatCombatantClassName(combatantProperties.combatantClass)}
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
        <ul className="list-none w-1/2 mr-1">
          {
            // combatant_attributes_as_vec.iter()
            //   .enumerate()
            //   .filter(|( i, _ )| i < &half_num_attributes)
            //   .map(|(_, (attribute, value))|
            //        attribute_list_item(
            //                attribute,
            //                value,
            //                &game_state,
            //                has_unspent_attribute_points,
            //                &websocket_state,
            //                playerOwnsCharacter,
            //                *show_attribute_assignment_buttons,
            //            )).collect::<Html>()
          }
          {
            // unspent_attribute_points_display
          }
        </ul>
        <ul className="list-none w-1/2 ml-1">
          {
            // combatant_attributes_as_vec.iter()
            //   .enumerate()
            //   .filter(|( i, _)| i >= &half_num_attributes)
            //   .map(|(_, (attribute, value))|
            //        attribute_list_item(
            //                attribute,
            //                value,
            //                &game_state,
            //                has_unspent_attribute_points,
            //                &websocket_state,
            //                playerOwnsCharacter,
            //                *show_attribute_assignment_buttons,
            //            )).collect::<Html>()
          }
        </ul>
      </div>
      <Divider extraStyles={"mr-2 ml-2 "} />
      {
        // hp_and_mp::hp_and_mp(&combatantProperties, &total_attributes)
      }
      {
        // <CharacterSheetWeaponDamage combatant_id={entityProperties.id} />
      }
    </div>
  );
}
