import React, { useEffect, useState } from "react";
import buildActionButtonProperties from "./build-action-button-properties";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useUIStore } from "@/stores/ui-store";
import { setAlert } from "@/app/components/alerts";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import getParty from "@/utils/getParty";
import collectActionMenuRelevantInformation from "./collect-action-menu-relevant-information";
import createGameActions from "./create-game-actions";
import getButtonDedicatedKeyAndCategory from "./get-button-dedicated-keys-and-category";
import { GameAction } from "./game-actions";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./action-menu-button-properties";
import { ACTION_MENU_PAGE_SIZE } from ".";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import calculateNumberOfPages from "./action-menu-buttons/calculate-number-of-pages";

interface Props {
  setButtonProperties: React.Dispatch<
    React.SetStateAction<Record<ActionButtonCategory, ActionMenuButtonProperties[]>>
  >;
  setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
}

export default function ActionMenuChangeDetectionHandler({
  setButtonProperties,
  setNumberOfPages,
}: Props) {
  const gameState = useGameStore();
  const getActiveCombatant = useGameStore().getActiveCombatant;
  const uiState = useUIStore();
  const mutateAlertState = useAlertStore().mutateState;
  const combatantModelsAwaitingSpawnLength = useGameStore().combatantModelsAwaitingSpawn.length;
  const actionCommandWaitingAreaLength = useGameStore().actionCommandWaitingArea.length;

  const pageNumber = gameState.actionMenuCurrentPageNumber;
  const [previouslyFocusedCharacterId, setPreviouslyFocusedCharacterId] = useState(
    gameState.focusedCharacterId
  );

  // EXTRACT FROM THE GAMESTATE ANYTHING THAT WE SHOULD WATCH FOR CHANGES
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
    if (focusedCharacterOption === null) return;

    if (previouslyFocusedCharacterId != focusedCharacterId)
      gameState.mutateState((store) => {
        store.actionMenuCurrentPageNumber = 0;
        store.actionMenuParentPageNumbers = [];
      });

    setPreviouslyFocusedCharacterId(focusedCharacterId);

    // know the page number
    // get relevant information
    const partyResult = getParty(gameState.game, gameState.username);
    if (partyResult instanceof Error) return setAlert(mutateAlertState, partyResult.message);
    const relevantInformationResult = collectActionMenuRelevantInformation(gameState, partyResult);
    if (relevantInformationResult instanceof Error)
      return setAlert(mutateAlertState, relevantInformationResult.message);
    const gameActions = createGameActions(relevantInformationResult);

    const gameActionsByButtonCategory: Record<ActionButtonCategory, GameAction[]> = {
      [ActionButtonCategory.Top]: [],
      [ActionButtonCategory.Numbered]: [],
      [ActionButtonCategory.NextPrevious]: [],
    };

    for (const gameAction of gameActions) {
      const { category } = getButtonDedicatedKeyAndCategory(gameAction);
      gameActionsByButtonCategory[category].push(gameAction);
    }

    const numberOfNumberedGameActions =
      gameActionsByButtonCategory[ActionButtonCategory.Numbered].length;

    setNumberOfPages(calculateNumberOfPages(ACTION_MENU_PAGE_SIZE, numberOfNumberedGameActions));

    gameActionsByButtonCategory[ActionButtonCategory.Numbered] = gameActionsByButtonCategory[
      ActionButtonCategory.Numbered
    ].slice(
      pageNumber * ACTION_MENU_PAGE_SIZE,
      pageNumber * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE
    );

    const buttonPropertiesByCategory: Record<ActionButtonCategory, ActionMenuButtonProperties[]> = {
      [ActionButtonCategory.Top]: [],
      [ActionButtonCategory.Numbered]: [],
      [ActionButtonCategory.NextPrevious]: [],
    };

    // build properties for dedicated key buttons AND numbered buttons ON CURRENT PAGE
    for (const [category, gameActions] of iterateNumericEnumKeyedRecord(
      gameActionsByButtonCategory
    )) {
      for (const gameAction of gameActions) {
        const buttonPropertiesResult = buildActionButtonProperties(
          gameState,
          uiState,
          mutateAlertState,
          gameAction
        );
        if (buttonPropertiesResult instanceof Error) {
          console.log("BUTTON PROPERTIES ERROR: ", buttonPropertiesResult);
          return setAlert(
            mutateAlertState,
            `Error creating button properties for game action type ${gameAction}`
          );
        } else buttonPropertiesByCategory[category].push(buttonPropertiesResult);
      }
    }

    setButtonProperties(buttonPropertiesByCategory);
  }, [
    pageNumber,
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
    combatantModelsAwaitingSpawnLength,
    actionCommandWaitingAreaLength,
  ]);

  return <></>;
}
