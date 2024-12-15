import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import React, { useEffect, useRef, useState } from "react";
import TargetingIndicators from "./TargetingIndicators";
import { entityIsDetailed } from "@/stores/game-store/detailable-entities";
import UnspentAttributesButton from "../UnspentAttributesButton";
import { useShallow } from "zustand/react/shallow";
import ValueBarsAndFocusButton from "./ValueBarsAndFocusButton";
import ActiveCombatantIcon from "./ActiveCombatantIcon";
import CombatantInfoButton from "./CombatantInfoButton";
import DetailedCombatantInfoCard from "./DetailedCombatantInfoCard";
import { ClientToServerEvent, Combatant, InputLock, Inventory } from "@speed-dungeon/common";
import requestSpawnCombatantModel from "./request-spawn-combatant-model";
import "./floating-text-animation.css";
import { BabylonControlledCombatantData } from "@/stores/game-store/babylon-controlled-combatant-data";
import { websocketConnection } from "@/singletons/websocket-connection";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";
import setFocusedCharacter from "@/utils/set-focused-character";
import { AssigningAttributePointsMenuState } from "../ActionMenu/menu-state/assigning-attribute-points";
import CombatantFloatingMessagesDisplay from "./combatant-floating-messages-display";
import InventoryIconButton from "./InventoryIconButton";

interface Props {
  combatant: Combatant;
  showExperience: boolean;
}

// tried using refs but the .current property wasn't mutable at runtime
// even though the refs were properly declared as mutable
// so we couldn't remove them at unmount and caused client crash when
// other players left the game
const modelDomPositionElements: { [entityId: string]: null | HTMLDivElement } = {};

export default function CombatantPlaque({ combatant, showExperience }: Props) {
  const gameOption = useGameStore().game;
  const mutateGameState = useGameStore().mutateState;
  const { detailedEntity, focusedCharacterId, hoveredEntity } = useGameStore(
    useShallow((state) => ({
      detailedEntity: state.detailedEntity,
      focusedCharacterId: state.focusedCharacterId,
      hoveredEntity: state.hoveredEntity,
    }))
  );
  const entityId = combatant.entityProperties.id;
  const babylonDebugMessages =
    useGameStore().babylonControlledCombatantDOMData[entityId]?.debugMessages;
  const modelsAwaitingSpawn = useGameStore().combatantModelsAwaitingSpawn;

  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;

  const { entityProperties, combatantProperties } = combatant;
  const battleOptionResult = getCurrentBattleOption(game, party.name);
  if (battleOptionResult instanceof Error) return <div>{battleOptionResult.message}</div>;
  const battleOption = battleOptionResult;

  // for measuring the element so we can get the correct portrait height
  // and getting the position so we can position the details window without going off the screen
  const combatantPlaqueRef = useRef<HTMLDivElement>(null);
  const nameAndBarsRef = useRef<HTMLDivElement>(null);
  const [portraitHeight, setPortraitHeight] = useState(0);
  useEffect(() => {
    if (!nameAndBarsRef.current) return;
    const height = nameAndBarsRef.current.clientHeight;
    setPortraitHeight(height);
  }, []);

  useEffect(() => {
    const element = document.getElementById(`${entityId}-position-div`);
    modelDomPositionElements[entityId] = element as HTMLDivElement | null;

    requestSpawnCombatantModel(combatant, party, element as HTMLDivElement | null);
    mutateGameState((state) => {
      state.babylonControlledCombatantDOMData[entityId] = new BabylonControlledCombatantData();
    });
    return () => {
      modelDomPositionElements[entityId] = null;
      delete modelDomPositionElements[entityId];

      mutateGameState((state) => {
        delete state.babylonControlledCombatantDOMData[entityId];
      });

      gameWorld.current?.modelManager.enqueueMessage(entityId, {
        type: ModelManagerMessageType.DespawnModel,
      });
    };
  }, []);

  function isHovered() {
    if (!hoveredEntity) return false;
    if (hoveredEntity instanceof Combatant) return false;
    if (hoveredEntity.entityProperties.id === entityId) return true;
    return false;
  }

  const combatantIsDetailed = entityIsDetailed(entityId, detailedEntity);
  const isFocused = focusedCharacterId === entityId;
  const isPartyMember = party.characterPositions.includes(entityId);

  const conditionalBorder = getConditionalBorder(isHovered(), isFocused, combatantIsDetailed);

  function handleUnspentAttributesButtonClick() {
    websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
      characterId: entityId,
      combatActionOption: null,
    });
    setFocusedCharacter(entityId);

    mutateGameState((store) => {
      store.stackedMenuStates = [new AssigningAttributePointsMenuState()];
    });
  }

  const lockedUiState =
    InputLock.isLocked(party.inputLock) || modelsAwaitingSpawn.includes(entityId)
      ? "opacity-50 pointer-events-none "
      : "pointer-events-auto ";

  return (
    <div className="">
      <div id={`${entityId}-position-div`} className="absolute">
        <CombatantFloatingMessagesDisplay entityId={entityId} />
        <div className="absolute flex flex-col justify-center items-center text-center top-1/2 left-1/2 -translate-x-1/2 w-[400px]">
          {babylonDebugMessages?.map((message) => (
            <div className="text-xl relative w-[400px] text-center" key={message.id}>
              <div className="">{message.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`w-[23rem] h-fit border bg-slate-700 flex p-2.5 relative box-border ${conditionalBorder} ${lockedUiState}`}
        ref={combatantPlaqueRef}
      >
        {isPartyMember && (
          <InventoryIconButton
            entityId={entityId}
            numItemsInInventory={Inventory.getTotalNumberOfItems(combatantProperties.inventory)}
          />
        )}
        <TargetingIndicators party={party} entityId={entityId} />
        <DetailedCombatantInfoCard combatantId={entityId} combatantPlaqueRef={combatantPlaqueRef} />
        <div
          className="h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full relative"
          style={{ height: `${portraitHeight}px` }}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
            {combatantProperties.level}
          </div>
        </div>
        <div className="flex-grow" ref={nameAndBarsRef}>
          <div className="mb-1.5 flex justify-between text-lg ">
            <span>
              <span className="">{entityProperties.name}</span>
              {
                // entityId.slice(0, 5)
              }
              <UnspentAttributesButton
                combatantProperties={combatantProperties}
                handleClick={handleUnspentAttributesButtonClick}
              />
            </span>
            <span className="flex items-center">
              <CombatantInfoButton combatant={combatant} />
            </span>
          </div>
          <ValueBarsAndFocusButton
            combatantId={entityId}
            combatantProperties={combatantProperties}
            isFocused={isFocused}
            showExperience={showExperience}
          />
        </div>
      </div>
      <ActiveCombatantIcon battleOption={battleOption} combatantId={entityId} />
    </div>
  );
}

function getConditionalBorder(
  infoButtonIsHovered: boolean,
  isFocused: boolean,
  combatantIsDetailed: boolean
) {
  return infoButtonIsHovered
    ? "border-white"
    : isFocused
      ? "border-lime-500"
      : combatantIsDetailed
        ? "border-yellow-400"
        : "border-slate-400";
}
