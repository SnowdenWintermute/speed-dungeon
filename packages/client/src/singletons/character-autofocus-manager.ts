import { CombatantTurnTracker, TurnTracker } from "@speed-dungeon/common";
import { GameState } from "@/stores/game-store";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";

export class CharacterAutoFocusManager {
  constructor() {}

  handleBattleStart(gameState: GameState, firstActiveTracker: TurnTracker) {
    if (firstActiveTracker instanceof CombatantTurnTracker) {
      const partyResult = gameState.getParty();
      if (partyResult instanceof Error) return console.error(partyResult.message);
      const party = partyResult;

      const { combatantManager } = party;
      const activeTrackerId = firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId;

      const newlyActiveTrackerIsPlayerControlled = combatantManager
        .getExpectedCombatant(activeTrackerId)
        .combatantProperties.isPlayerControlled();

      if (newlyActiveTrackerIsPlayerControlled) {
        const trackerId = firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId;
        AppStore.get().gameStore.setFocusedCharacter(trackerId);
      }
    }
  }

  focusFirstOwnedCharacter(gameState: GameState) {
    // if viewing menu other than ItemsOnGround, do nothing
    const { actionMenuStore, gameStore } = AppStore.get();
    const clientIsViewingMenus = actionMenuStore.hasStackedMenus();
    const currentMenu = actionMenuStore.getCurrentMenu();
    if (clientIsViewingMenus && currentMenu.type !== MenuStateType.ItemsOnGround) {
      console.info("not switching focus since in menus");
      return;
    }

    const playerResult = gameState.getPlayer();
    if (playerResult instanceof Error) throw playerResult;

    const firstOwnedCharacterId = playerResult.characterIds[0];
    if (!firstOwnedCharacterId) return console.error("Player doesn't own any characters");

    gameStore.setFocusedCharacter(firstOwnedCharacterId);
  }

  updateFocusedCharacterOnNewTurnOrder(gameState: GameState, newlyActiveTracker: TurnTracker) {
    const partyResult = gameState.getParty();
    if (partyResult instanceof Error) return console.error(partyResult.message);
    const party = partyResult;

    // if viewing menu other than ItemsOnGround, do nothing
    const { actionMenuStore } = AppStore.get();
    const clientIsViewingMenus = actionMenuStore.hasStackedMenus();
    const currentMenu = actionMenuStore.getCurrentMenu();
    if (clientIsViewingMenus && currentMenu.type !== MenuStateType.ItemsOnGround) return;

    if (newlyActiveTracker instanceof CombatantTurnTracker) {
      const { combatantManager } = party;
      const activeTrackerId = newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId;

      const newlyActiveTrackerIsPlayerControlled = combatantManager
        .getExpectedCombatant(activeTrackerId)
        .combatantProperties.isPlayerControlled();

      if (newlyActiveTrackerIsPlayerControlled) {
        gameState.focusedCharacterId = newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId;
      }
    }
  }
}

export const characterAutoFocusManager = new CharacterAutoFocusManager();
