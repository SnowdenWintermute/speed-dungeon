import { setAlert } from "@/app/components/alerts";
import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state";
import { shouldShowCharacterSheet } from "./should-show-character-sheet";
import getCurrentParty from "./getCurrentParty";

export default function setFocusedCharacter(id: string) {
  useGameStore.getState().mutateState((gameState) => {
    const partyOption = getCurrentParty(gameState, gameState.username || "");
    if (!partyOption) {
      console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
      return;
    }
    const characterSwitchingFocusAwayFromId = gameState.focusedCharacterId;
    const characterSwitchingFocusAwayFromOption = partyOption.combatantManager.getCombatantOption(
      characterSwitchingFocusAwayFromId
    );

    gameState.detailedEntity = null;
    gameState.hoveredEntity = null;
    gameState.focusedCharacterId = id;

    gameState.hoveredCombatantAbility = null;
    gameState.detailedCombatantAbility = null;

    let currentMenu = getCurrentMenu(gameState);

    if (
      !shouldShowCharacterSheet(currentMenu.type) &&
      currentMenu.type !== MenuStateType.ItemsOnGround &&
      currentMenu.type !== MenuStateType.RepairItemSelection &&
      currentMenu.type !== MenuStateType.CraftingItemSelection &&
      currentMenu.type !== MenuStateType.PurchasingItems
    )
      gameState.stackedMenuStates = [];
    if (currentMenu.type === MenuStateType.ItemSelected) {
      gameState.stackedMenuStates.pop();
    }
    // otherwise you'll end up looking at crafting action selection on an unowned item
    if (
      shouldShowCharacterSheet(currentMenu.type) &&
      gameState.stackedMenuStates
        .map((menuState) => menuState.type)
        .includes(MenuStateType.CraftingActionSelection)
    ) {
      gameState.stackedMenuStates = gameState.stackedMenuStates.filter(
        (menuState) => menuState.type !== MenuStateType.CraftingActionSelection
      );
    }

    currentMenu = getCurrentMenu(gameState);
    currentMenu.page = 1;

    const game = gameState.game;
    if (!game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    if (!gameState.username) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME));
    const playerOption = game.players[gameState.username];
    if (!playerOption) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
    const playerOwnsCharacterSwitchingFocusAwayFrom = playerOption.characterIds.includes(
      characterSwitchingFocusAwayFromId
    );

    if (
      playerOwnsCharacterSwitchingFocusAwayFrom &&
      characterSwitchingFocusAwayFromOption?.combatantProperties.targetingProperties.getSelectedActionAndRank()
    ) {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: characterSwitchingFocusAwayFromId,
        actionAndRankOption: null,
      });
    }
  });
}
