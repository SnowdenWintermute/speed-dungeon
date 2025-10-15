import {
  ActionUserContext,
  ClientToServerEvent,
  Combatant,
  ERROR_MESSAGES,
  EntityId,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { AppStore } from "../app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";

export class GameStore {
  private game: null | SpeedDungeonGame = null;
  username: null | string = null;
  focusedCharacterId: EntityId | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  hasGame: () => boolean = () => {
    throw new Error("not implementeted");
  };

  getCurrentPartyOption() {
    if (this.username === null || this.game === null) return undefined;
    const player = this.game.players[this.username];
    if (!player?.partyName) return undefined;
    return this.game.adventuringParties[player.partyName];
  }

  setFocusedCharacter(entityId: EntityId) {
    if (this.username === null) throw new Error("expected to have initialized a username");
    const { actionMenuStore, focusStore } = AppStore.get();
    actionMenuStore.clearHoveredAction();
    focusStore.detailable.clear();
    focusStore.combatantAbility.clear();

    if (this.focusedCharacterId !== null) {
      this.handleCharacterUnfocused(this.focusedCharacterId);
    }

    this.focusedCharacterId = entityId;

    let currentMenu = actionMenuStore.getCurrentMenu();

    if (
      !actionMenuStore.shouldShowCharacterSheet() &&
      !actionMenuStore.operatingVendingMachine() &&
      currentMenu.type !== MenuStateType.ItemsOnGround
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
  }

  private handleCharacterUnfocused(id: EntityId) {
    if (this.username === null) throw new Error("expected to have initialized a username");

    const partyOption = this.getCurrentPartyOption();
    if (!partyOption) {
      return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    }

    const previouslyFocused = partyOption.combatantManager.getCombatantOption(id);
    if (previouslyFocused === undefined) return;

    const playerOwnsCombatant = partyOption.combatantManager.playerOwnsCharacter(this.username, id);
    const { targetingProperties } = previouslyFocused.combatantProperties;

    const hadSelectedAction = targetingProperties.getSelectedActionAndRank();
    const shouldDeselectAction = playerOwnsCombatant && hadSelectedAction;

    if (shouldDeselectAction) {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: id,
        actionAndRankOption: null,
      });
    }
  }

  characterIsFocused(entityId: EntityId) {
    return this.focusedCharacterId === entityId;
  }

  getFocusedCharacterIdOption() {
    return this.focusedCharacterId;
  }

  getExpectedFocusedCharacterId() {
    if (this.focusedCharacterId === null) {
      throw new Error("expected to have set a focusedCharacterId");
    }
    return this.focusedCharacterId;
  }

  getExpectedFocusedCharacter() {
    const focusedCharacterOption = this.getFocusedCharacterOption();
    if (focusedCharacterOption === undefined) {
      throw new Error("expected focused character was undefined");
    }
    return focusedCharacterOption;
  }

  getFocusedCharacterOption: () => undefined | Combatant = () => {
    const focusedCharacterId = this.getFocusedCharacterIdOption();
    if (this.game === null || focusedCharacterId === null) return undefined;
    const result = SpeedDungeonGame.getCombatantById(this.game, focusedCharacterId);
    if (result instanceof Error) {
      console.error(result);
      return undefined;
    } else {
      return result;
    }
  };

  getActionUserContext(): Error | ActionUserContext {
    throw new Error("not implemented");
    // const gameOption = gameState.game;

    // if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    // const game = gameOption;
    // if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    // const partyOptionResult = getCurrentParty(gameState, gameState.username);
    // if (partyOptionResult instanceof Error) return partyOptionResult;
    // if (partyOptionResult === undefined) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    // const party = partyOptionResult;
    // const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
    // if (combatantResult instanceof Error) return combatantResult;
    // return new ActionUserContext(game, party, combatantResult);
  }
}
