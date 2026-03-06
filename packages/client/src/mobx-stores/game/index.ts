import {
  ClientIntentType,
  Combatant,
  CombatantContext,
  CombatantId,
  ERROR_MESSAGES,
  EntityId,
  SpeedDungeonGame,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { AppStore } from "../app-store";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { gameClientSingleton } from "@/singletons/lobby-client";

export class GameStore {
  private game: null | SpeedDungeonGame = null;
  private username: null | Username = null;
  private focusedCharacterId: CombatantId | null = null;
  // private gameClient: GameClient|null = null;

  constructor() {
    makeAutoObservable(this);
  }

  getUsernameOption() {
    return this.username;
  }

  getExpectedUsername() {
    if (this.username === null) throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    return this.username;
  }

  setUsername(username: Username) {
    this.username = username;
  }

  clearUsername() {
    this.username = null;
  }

  getExpectedPlayer(username: Username) {
    const playerOption = this.getExpectedGame().getPlayer(username);
    if (playerOption === undefined) {
      throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    }
    return playerOption;
  }

  getExpectedClientPlayer() {
    if (this.username === null) {
      throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    }
    return this.getExpectedPlayer(this.username);
  }

  getCombatantOption(combatantId: EntityId) {
    return this.getPartyOption()?.combatantManager.getCombatantOption(combatantId);
  }

  getExpectedCombatant(combatantId: EntityId) {
    return this.getExpectedParty().combatantManager.getExpectedCombatant(combatantId);
  }

  setGame(game: SpeedDungeonGame) {
    console.log("set game in store:", game.adventuringParties);
    this.game = game;
  }

  clearGame() {
    this.game = null;
    this.focusedCharacterId = null;
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

  getExpectedPlayerContext(username: Username) {
    const game = this.getExpectedGame();
    const player = game.getExpectedPlayer(username);
    if (player.partyName === null) throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    const party = game.getExpectedParty(player.partyName);
    return { game, party, player };
  }

  getFocusedCharacterContext() {
    return this.getExpectedCombatantContext(this.getExpectedFocusedCharacterId());
  }

  getPartyOption() {
    if (this.username === null || this.game === null) {
      return undefined;
    }
    const player = this.game.getPlayer(this.username);
    if (!player) {
      return undefined;
    }
    return this.game.getPlayerPartyOption(player.username);
  }

  getExpectedParty() {
    const partyOption = this.getPartyOption();
    if (partyOption === undefined) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    return partyOption;
  }

  setFocusedCharacter(entityId: CombatantId) {
    if (this.username === null) {
      throw new Error("expected to have initialized a username");
    }
    if (this.focusedCharacterId === entityId) {
      return console.info("already focusing character id:", entityId);
    }

    const { actionMenuStore, focusStore } = AppStore.get();
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

  private handleCharacterUnfocused(id: CombatantId) {
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
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.SelectCombatAction,
        data: {
          characterId: id,
          actionAndRankOption: null,
        },
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
    const result = this.game.getExpectedCombatant(focusedCharacterId);
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

  clientUserControlsFocusedCombatant(options?: { includePets: boolean }) {
    const usernameOption = this.getUsernameOption();
    if (!usernameOption) {
      return false;
    }

    const isDirectController = this.clientUserControlsCombatant(
      this.getExpectedFocusedCharacterId()
    );

    if (isDirectController) {
      return true;
    }

    if (options?.includePets) {
      const focusedCombatant = this.getExpectedFocusedCharacter();

      const partyOption = this.getPartyOption();
      if (partyOption === undefined) return false;

      const { controlledBy } = focusedCombatant.combatantProperties;
      const isPetOfThisPlayer = controlledBy.wasSummonedByCharacterControlledByPlayer(
        usernameOption,
        partyOption
      );

      return isPetOfThisPlayer;
    }

    return false;
  }
}
