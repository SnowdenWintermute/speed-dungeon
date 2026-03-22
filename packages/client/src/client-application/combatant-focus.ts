import {
  ClientIntentType,
  CombatantId,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  TurnTracker,
} from "@speed-dungeon/common";
import { ClientApplicationGameContext } from "./client-application-game-context";
import { ClientApplicationSession } from "./client-application-session";
import { ActionMenu } from "./action-menu";
import { DetailableEntityFocus } from "./detailables/detailable-entity-focus";
import { ActionMenuScreenType } from "./action-menu/screen-types";
import { ClientSingleton } from "./clients/singleton";
import { ClientApplication } from ".";
import { GameClient } from "./clients/game";

export class CombatantFocus {
  private focusedCharacterId: CombatantId | null = null;

  private gameClientRef: ClientSingleton<GameClient>;
  private clientSession: ClientApplicationSession;
  private gameContext: ClientApplicationGameContext;
  private actionMenu: ActionMenu;
  private detailableEntityFocus: DetailableEntityFocus;

  constructor(clientApplication: ClientApplication) {
    this.gameClientRef = clientApplication.gameClientRef;
    this.clientSession = clientApplication.session;
    this.gameContext = clientApplication.gameContext;
    this.actionMenu = clientApplication.actionMenu;
    this.detailableEntityFocus = clientApplication.detailableEntityFocus;
  }

  get focusedCharacterIdOption() {
    return this.focusedCharacterId;
  }

  setFocusedCharacter(combatantId: CombatantId) {
    this.clientSession.requireUsername();
    if (this.focusedCharacterId === combatantId) {
      return console.info("already focusing character id:", combatantId);
    }

    this.detailableEntityFocus.detailables.clear();
    this.detailableEntityFocus.combatantAbilities.clear();

    if (this.focusedCharacterId !== null) {
      this.handleCharacterUnfocused(this.focusedCharacterId);
    }

    this.focusedCharacterId = combatantId;

    const shouldResetActionMenu =
      !this.actionMenu.shouldShowCharacterSheet() &&
      !this.actionMenu.operatingVendingMachine() &&
      !this.actionMenu.isViewingItemsOnGround();

    if (shouldResetActionMenu) {
      this.actionMenu.clearStack();
    }

    if (this.actionMenu.currentMenuIsType(ActionMenuScreenType.ItemSelected)) {
      this.actionMenu.popStack();
    }

    const staleItemCraftingMenuInStack =
      this.actionMenu.shouldShowCharacterSheet() &&
      this.actionMenu.stackedMenusIncludeType(ActionMenuScreenType.CraftingActionSelection);

    // otherwise you'll end up looking at crafting action selection on an unowned item
    if (staleItemCraftingMenuInStack) {
      this.actionMenu.removeMenuFromStack(ActionMenuScreenType.CraftingActionSelection);
    }

    if (this.actionMenu.isInitialized()) {
      const currentMenu = this.actionMenu.getCurrentMenu();
      currentMenu.goToFirstPage();
    }
  }

  characterIsFocused(combatantId: CombatantId) {
    return this.focusedCharacterId === combatantId;
  }

  get focusedCharacterOption() {
    const focusedCharacterId = this.focusedCharacterIdOption;
    if (focusedCharacterId === null) {
      return undefined;
    }
    return this.gameContext.getCombatantOption(focusedCharacterId);
  }

  requireFocusedCharacter() {
    const focusedCharacterOption = this.focusedCharacterOption;
    if (focusedCharacterOption === undefined) {
      throw new Error("expected focused character was undefined");
    }
    return focusedCharacterOption;
  }

  requireFocusedCharacterId() {
    if (this.focusedCharacterId === null) {
      throw new Error("expected to have set a focusedCharacterId");
    }
    return this.focusedCharacterId;
  }

  requireFocusedCharacterContext() {
    return this.gameContext.requireCombatantContext(this.requireFocusedCharacterId());
  }

  private handleCharacterUnfocused(id: CombatantId) {
    const username = this.clientSession.requireUsername();
    const { partyOption } = this.gameContext;
    if (!partyOption) {
      return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    }

    const previouslyFocused = partyOption.combatantManager.getCombatantOption(id);
    if (previouslyFocused === undefined) {
      return;
    }

    const playerOwnsCombatant = partyOption.combatantManager.playerOwnsCharacter(username, id);
    const { targetingProperties } = previouslyFocused.combatantProperties;

    const hadSelectedAction = targetingProperties.getSelectedActionAndRank();
    const shouldDeselectAction = playerOwnsCombatant && hadSelectedAction;

    if (!shouldDeselectAction) {
      return;
    }

    this.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.SelectCombatAction,
      data: {
        characterId: id,
        actionAndRankOption: null,
      },
    });
  }

  clientUserControlsFocusedCombatant(options?: { includePets: boolean }) {
    const { usernameOption } = this.clientSession;
    if (!usernameOption) {
      return false;
    }

    const isDirectController = this.gameContext.clientUserControlsCombatant(
      this.requireFocusedCharacterId()
    );

    if (isDirectController) {
      return true;
    }

    if (options?.includePets) {
      const { combatant, party } = this.requireFocusedCharacterContext();

      const { controlledBy } = combatant.combatantProperties;
      const isPetOfThisPlayer = controlledBy.wasSummonedByCharacterControlledByPlayer(
        usernameOption,
        party
      );

      return isPetOfThisPlayer;
    }

    return false;
  }

  handleBattleStart(firstActiveTracker: TurnTracker) {
    if (!(firstActiveTracker instanceof CombatantTurnTracker)) {
      return;
    }
    const { combatantManager } = this.gameContext.requireParty();
    const activeTrackerId = firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId;

    const newlyActiveTrackerIsPlayerControlled = combatantManager
      .getExpectedCombatant(activeTrackerId)
      .combatantProperties.controlledBy.isPlayerControlled();

    if (newlyActiveTrackerIsPlayerControlled) {
      const trackerId = firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId;
      this.setFocusedCharacter(trackerId);
    }
  }

  focusFirstOwnedCharacter() {
    // don't interrupt menuing. items on ground menu is default state after battle so switching focus is fine.
    const clientIsViewingMenus = this.actionMenu.hasStackedMenus();
    const wouldInterruptMenuing = clientIsViewingMenus && !this.actionMenu.isViewingItemsOnGround();
    if (wouldInterruptMenuing) {
      return;
    }

    const playerResult = this.gameContext.requireClientPlayer();
    const firstOwnedCharacterId = playerResult.characterIds[0];
    if (!firstOwnedCharacterId) {
      return console.error("Player doesn't own any characters");
    }

    this.setFocusedCharacter(firstOwnedCharacterId);
  }

  updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker: TurnTracker) {
    // don't interrupt menuing. items on ground menu is default state after battle so switching focus is fine.
    const clientIsViewingMenus = this.actionMenu.hasStackedMenus();
    const wouldInterruptMenuing = clientIsViewingMenus && !this.actionMenu.isViewingItemsOnGround();
    if (wouldInterruptMenuing) {
      return;
    }

    const party = this.gameContext.requireParty();

    if (newlyActiveTracker instanceof CombatantTurnTracker) {
      const { combatantManager } = party;
      const activeTrackerId = newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId;

      const newlyActiveTrackerIsPlayerControlled = combatantManager
        .getExpectedCombatant(activeTrackerId)
        .combatantProperties.controlledBy.isPlayerControlled();

      if (newlyActiveTrackerIsPlayerControlled) {
        this.setFocusedCharacter(newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId);
      }
    }
  }

  disableButtonBecauseNotThisCombatantTurn(combatantId: string) {
    const { game, party } = this.requireFocusedCharacterContext();

    const battleOption = party.getBattleOption(game);
    let disableButtonBecauseNotThisCombatantTurn = false;

    if (battleOption && !(battleOption instanceof Error)) {
      disableButtonBecauseNotThisCombatantTurn =
        !battleOption.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
    }

    return disableButtonBecauseNotThisCombatantTurn;
  }
}
