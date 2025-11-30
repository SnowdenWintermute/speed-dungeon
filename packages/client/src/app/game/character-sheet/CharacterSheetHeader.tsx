import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import TextInput from "@/app/components/atoms/TextInput";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { getCombatantClassIcon } from "@/utils/get-combatant-class-icon";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantProperties,
  EntityProperties,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

interface Props {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
}

export const CharacterSheetHeader = observer((props: Props) => {
  const [isEditingName, setIsEditingName] = useState(false);

  const { entityProperties, combatantProperties } = props;
  const { name, id } = entityProperties;

  const [editNameText, setEditNameText] = useState(name);

  useEffect(() => {
    setIsEditingName(false);
    setEditNameText(name);
  }, [id]);

  const { classProgressionProperties } = combatantProperties;
  const mainClassProperties = classProgressionProperties.getMainClass();
  const supportClassProperties = classProgressionProperties.getSupportClassOption();

  const { experiencePoints } = classProgressionProperties;
  const requiredForNextLevel = experiencePoints.getRequiredForNextLevel();

  const expRequiredForNextLevelString =
    typeof requiredForNextLevel === "number" ? requiredForNextLevel.toString() : "∞";

  const { controlledBy } = combatantProperties;
  const isPlayerControlled = controlledBy.isPlayerControlled();
  const isPlayerPet = controlledBy.isPlayerPet();
  const shouldShowExp = isPlayerControlled || isPlayerPet;

  const party = AppStore.get().gameStore.getExpectedParty();
  const player = AppStore.get().gameStore.getExpectedClientPlayer();
  const isPetOfClientPlayer = controlledBy.wasSummonedByCharacterControlledByPlayer(
    player.username,
    party
  );

  const experiencePointsText = shouldShowExp
    ? `${experiencePoints.getCurrent()} / ${expRequiredForNextLevelString} experience`
    : "";

  return (
    <div>
      <div className="font-bold flex justify-between items-center">
        <div className="h-5 flex">
          {isPetOfClientPlayer && (
            <HotkeyButton
              onClick={() => {
                setIsEditingName(!isEditingName);
              }}
              className="mr-1"
            >
              {" "}
              {SVG_ICONS[IconName.EditPencil]("h-full fill-slate-400")}
            </HotkeyButton>
          )}
          {isEditingName ? (
            <TextInput
              className="bg-transparent"
              autofocus={true}
              placeholder={"Enter a name..."}
              name={"Edit name"}
              onChange={(e) => {
                setEditNameText(e.target.value);
              }}
              value={editNameText}
            />
          ) : (
            <span>{name}</span>
          )}
        </div>
        <span className="h-10 w-10 flex justify-center rotate-45">
          {getCombatantClassIcon(
            mainClassProperties.combatantClass,
            "fill-slate-400",
            "stroke-slate-400"
          )}
        </span>
      </div>
      <div className="flex justify-between">
        <span>
          {"Level "}
          {mainClassProperties.level}
          {` ${COMBATANT_CLASS_NAME_STRINGS[mainClassProperties.combatantClass]}`}
          {supportClassProperties
            ? ` / ${supportClassProperties.level} ${COMBATANT_CLASS_NAME_STRINGS[supportClassProperties.combatantClass]}`
            : ""}
        </span>
        <span>{experiencePointsText}</span>
      </div>
      <Divider extraStyles={"mr-2 ml-2 "} />
    </div>
  );
});
