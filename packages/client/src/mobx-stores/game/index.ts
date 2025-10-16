import {
  ActionUserContext,
  ClientToServerEvent,
  Combatant,
  CombatantContext,
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
  private username: null | string = null;
  private focusedCharacterId: EntityId | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getExpectedUsername() {
    if (this.username === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    return this.username;
  }

  setUsername(username: string) {
    this.username = username;
  }

  getExpectedPlayer(username: string) {
    const playerOption = this.getExpectedGame().players[username];
    if (playerOption === undefined) throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    return playerOption;
  }

  getExpectedClientPlayer() {
    if (this.username === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    return this.getExpectedPlayer(this.username);
  }

  getCombatantOption(combatantId: EntityId) {
    return this.getPartyOption()?.combatantManager.getCombatantOption(combatantId);
  }

  getExpectedCombatant(combatantId: EntityId) {
    return this.getExpectedParty().combatantManager.getExpectedCombatant(combatantId);
  }

  setGame(game: SpeedDungeonGame) {
    this.game = game;
  }

  clearGame() {
    this.game = null;
  }

  getGameOption() {
    return this.game;
  }

  getExpectedGame() {
    if (this.game === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    return this.game;
  }

  getCombatantContext(combatantId: EntityId): CombatantContext {
    const party = this.getExpectedParty();
    const game = this.getExpectedGame();
    const combatant = party.combatantManager.getExpectedCombatant(combatantId);
    return new CombatantContext(game, party, combatant);
  }

  getFocusedCharacterContext() {
    return this.getCombatantContext(this.getExpectedFocusedCharacterId());
  }

  getPartyOption() {
    if (this.username === null || this.game === null) return undefined;
    const player = this.game.players[this.username];
    if (!player?.partyName) return undefined;
    return this.game.adventuringParties[player.partyName];
  }

  getExpectedParty() {
    const partyOption = this.getPartyOption();
    if (partyOption === undefined) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    return partyOption;
  }

  setFocusedCharacter(entityId: EntityId) {
    if (this.username === null) throw new Error("expected to have initialized a username");
    if (this.focusedCharacterId === entityId) return;
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

    const partyOption = this.getPartyOption();
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

  private clientUserControlsCombatant(combatantId: string) {
    const partyOption = this.getPartyOption();
    if (partyOption === undefined) return false;
    return partyOption.combatantManager.playerOwnsCharacter(this.username || "", combatantId);
  }

  clientUserControlsFocusedCombatant() {
    return this.clientUserControlsCombatant(this.getExpectedFocusedCharacterId());
  }
}
