import React, { useEffect, useState } from "react";
import buildActionButtonProperties, {
  ActionButtonPropertiesByCategory,
} from "./build-action-button-properties";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { useUIStore } from "@/stores/ui-store";
import { setAlert } from "@/app/components/alerts";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";

interface Props {
  setButtonProperties: React.Dispatch<React.SetStateAction<ActionButtonPropertiesByCategory>>;
}

export default function ActionMenuChangeDetectionHandler({ setButtonProperties }: Props) {
  const socketOption = useWebsocketStore().socketOption;
  const gameState = useGameStore();
  const getActiveCombatant = useGameStore().getActiveCombatant;
  const uiState = useUIStore();
  const mutateAlertState = useAlertStore().mutateState;

  const [previouslyFocusedCharacterId, setPreviouslyFocusedCharacterId] = useState(
    gameState.focusedCharacterId
  );

  // extract from the gameState anything that we should watch for changes
  const { focusedCharacterId, menuContext, detailedEntity } = gameState;
  const selectedItem =
    detailedEntity?.type === DetailableEntityType.Item ? detailedEntity.item : null;
  const activeCombatantResult = getActiveCombatant();
  const activeCombatantIdOption =
    activeCombatantResult instanceof Error
      ? null
      : activeCombatantResult?.entityProperties.id ?? null;
  const focusedCharacterResult = getFocusedCharacter(gameState);
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  const actionTargetOption =
    focusedCharacterResult instanceof Error
      ? null
      : focusedCharacterResult.combatantProperties.combatActionTarget;
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  const [_, party] = gameAndPartyResult instanceof Error ? [null, null] : gameAndPartyResult;
  const battleIdOption = party?.battleId;
  let focusedCharacterEquipmentIds = Object.values(
    focusedCharacterOption?.combatantProperties.equipment || {}
  ).map((item) => item.entityProperties.id);

  const numItemsInFocusedCharacterInventory =
    focusedCharacterOption?.combatantProperties.inventory.items.length;
  const numItemsOnGround = party?.currentRoom.items.length;

  useEffect(() => {
    if (previouslyFocusedCharacterId != focusedCharacterId)
      gameState.mutateState((store) => {
        store.actionMenuCurrentPageNumber = 0;
        store.actionMenuParentPageNumbers = [];
      });

    setPreviouslyFocusedCharacterId(focusedCharacterId);

    const updatedButtonPropertiesResult = buildActionButtonProperties(
      gameState,
      uiState,
      mutateAlertState,
      socketOption
    );

    if (updatedButtonPropertiesResult instanceof Error) {
      setAlert(mutateAlertState, updatedButtonPropertiesResult.message);
    } else setButtonProperties(updatedButtonPropertiesResult);
  }, [
    focusedCharacterId,
    activeCombatantIdOption,
    menuContext,
    actionTargetOption,
    party?.currentRoom.roomType,
    numItemsInFocusedCharacterInventory,
    numItemsOnGround,
    selectedItem?.entityProperties.id,
    focusedCharacterOption?.combatantProperties.selectedCombatAction,
    // // @TODO - current animation processing,
    focusedCharacterOption?.combatantProperties.unspentAttributePoints,
    battleIdOption,
    uiState.modKeyHeld,
    JSON.stringify(focusedCharacterEquipmentIds),
  ]);

  return <></>;
}
