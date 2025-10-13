import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import getCurrentParty from "./getCurrentParty";
import { AppStore } from "@/mobx-stores/app-store";

export default function setFocusedCharacter(id: string) {
  const { actionMenuStore } = AppStore.get();
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

    const { focusStore } = AppStore.get();
    focusStore.detailable.clear();

    gameState.focusedCharacterId = id;

    focusStore.combatantAbility.clear();

    let currentMenu = actionMenuStore.getCurrentMenu();

    if (
      !actionMenuStore.shouldShowCharacterSheet() &&
      currentMenu.type !== MenuStateType.ItemsOnGround &&
      currentMenu.type !== MenuStateType.RepairItemSelection &&
      currentMenu.type !== MenuStateType.CraftingItemSelection &&
      currentMenu.type !== MenuStateType.PurchasingItems
    ) {
      actionMenuStore.clearStack();
    }

    if (currentMenu.type === MenuStateType.ItemSelected) {
      actionMenuStore.popStack();
    }

    // otherwise you'll end up looking at crafting action selection on an unowned item
    if (
      actionMenuStore.shouldShowCharacterSheet() &&
      actionMenuStore.stackedMenusIncludeType(MenuStateType.CraftingActionSelection)
    ) {
      actionMenuStore.removeMenuFromStack(MenuStateType.CraftingActionSelection);
    }

    currentMenu = actionMenuStore.getCurrentMenu();
    currentMenu.goToFirstPage();

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
