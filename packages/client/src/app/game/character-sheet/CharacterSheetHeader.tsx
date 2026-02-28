import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import TextInput from "@/app/components/atoms/TextInput";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { gameClientSingleton } from "@/singletons/lobby-client";
import { getCombatantClassIcon } from "@/utils/get-combatant-class-icon";
import {
  ClientIntentType,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantId,
  CombatantProperties,
  EntityName,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React, { FormEvent, useEffect, useState } from "react";

interface Props {
  name: string;
  entityId: CombatantId;
  combatantProperties: CombatantProperties;
}

export const CharacterSheetHeader = observer((props: Props) => {
  const [isEditingName, setIsEditingName] = useState(false);

  const { combatantProperties, entityId, name } = props;

  const [editNameText, setEditNameText] = useState(name);

  useEffect(() => {
    setIsEditingName(false);
    setEditNameText(name);
  }, [entityId]);

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

  const { gameStore } = AppStore.get();
  const party = gameStore.getExpectedParty();
  const player = gameStore.getExpectedClientPlayer();
  const isPetOfClientPlayer = controlledBy.wasSummonedByCharacterControlledByPlayer(
    player.username,
    party
  );

  const experiencePointsText = shouldShowExp
    ? `${experiencePoints.getCurrent()} / ${expRequiredForNextLevelString} experience`
    : "";

  function handleSubmitChangePetName(e: FormEvent) {
    e.preventDefault();

    gameClientSingleton.get().dispatchIntent({
      type: ClientIntentType.RenamePet,
      data: {
        petId: entityId,
        newName: editNameText as EntityName,
      },
    });

    setIsEditingName(false);
  }

  return (
    <div>
      <div className="font-bold flex justify-between items-center">
        <div className="h-6 flex">
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
            <form onSubmit={handleSubmitChangePetName} className="flex h-full">
              <TextInput
                className="bg-transparent "
                autofocus={true}
                placeholder={"Enter a name..."}
                name={"Edit name"}
                onChange={(e) => {
                  setEditNameText(e.target.value);
                }}
                onEscape={() => {
                  setIsEditingName(false);
                }}
                value={editNameText}
              />
            </form>
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
