import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  Combatant,
  CombatantContext,
  ERROR_MESSAGES,
  EntityId,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { AppStore } from "../app-store";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { Socket } from "socket.io-client";

export class GameStore {
  private game: null | SpeedDungeonGame = null;
  private username: null | string = null;
  private focusedCharacterId: EntityId | null = null;
  private websocketConnection: Socket<ServerToClientEventTypes, ClientToServerEventTypes> | null =
    null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /** Without this we will get a circular reference because we use the websocketConnection in methods
   of this store, and websocketConnection also calls AppStore methods and AppStore composes this store */
  initialize(websocketConnection: Socket<ServerToClientEventTypes, ClientToServerEventTypes>) {
    this.websocketConnection = websocketConnection;
  }

  getUsernameOption() {
    return this.username;
  }

  getExpectedUsername() {
    if (this.username === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    return this.username;
  }

  setUsername(username: string) {
    this.username = username;
  }

  clearUsername() {
    this.username = null;
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

  getExpectedCombatantContext(combatantId: EntityId): CombatantContext {
    const party = this.getExpectedParty();
    const game = this.getExpectedGame();
    const combatant = party.combatantManager.getExpectedCombatant(combatantId);
    return new CombatantContext(game, party, combatant);
  }

  getExpectedPlayerContext(username: string) {
    const game = this.getExpectedGame();
    if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const player = game.players[username];
    if (!player) throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    if (player.partyName === null) throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    const party = game.adventuringParties[player.partyName];
    if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    return { game, party, player };
  }

  getFocusedCharacterContext() {
    return this.getExpectedCombatantContext(this.getExpectedFocusedCharacterId());
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
    if (this.username === null) {
      throw new Error("expected to have initialized a username");
    }
    if (this.focusedCharacterId === entityId) {
      return console.info("already focusing character id:", entityId);
    }

    const { actionMenuStore, focusStore } = AppStore.get();
    actionMenuStore.clearHoveredAction();
    focusStore.detailables.clear();
    focusStore.combatantAbilities.clear();

    if (this.focusedCharacterId !== null) {
      this.handleCharacterUnfocused(this.focusedCharacterId);
    }

    this.focusedCharacterId = entityId;

    if (
      !actionMenuStore.shouldShowCharacterSheet() &&
      !actionMenuStore.operatingVendingMachine() &&
      !actionMenuStore.isViewingItemsOnGround()
    ) {
      actionMenuStore.clearStack();
    }

    if (actionMenuStore.currentMenuIsType(MenuStateType.ItemSelected)) {
      actionMenuStore.popStack();
    }

    // otherwise you'll end up looking at crafting action selection on an unowned item
    if (
      actionMenuStore.shouldShowCharacterSheet() &&
      actionMenuStore.stackedMenusIncludeType(MenuStateType.CraftingActionSelection)
    ) {
      actionMenuStore.removeMenuFromStack(MenuStateType.CraftingActionSelection);
    }

    if (actionMenuStore.isInitialized()) {
      const currentMenu = actionMenuStore.getCurrentMenu();
      currentMenu.goToFirstPage();
    }
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

    if (this.websocketConnection === null) {
      return console.error("couldn't send deselect action packet - no websocket connection");
    }

    if (shouldDeselectAction) {
      this.websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
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
