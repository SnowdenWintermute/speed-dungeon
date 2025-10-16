import { CombatantTurnTracker, TurnTracker } from "@speed-dungeon/common";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";

export class CharacterAutoFocusManager {
  constructor() {}

  handleBattleStart(firstActiveTracker: TurnTracker) {
    if (firstActiveTracker instanceof CombatantTurnTracker) {
      const party = AppStore.get().gameStore.getExpectedParty();

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

  focusFirstOwnedCharacter() {
    // if viewing menu other than ItemsOnGround, do nothing
    const { actionMenuStore, gameStore } = AppStore.get();
    const clientIsViewingMenus = actionMenuStore.hasStackedMenus();
    const currentMenu = actionMenuStore.getCurrentMenu();
    if (clientIsViewingMenus && currentMenu.type !== MenuStateType.ItemsOnGround) {
      console.info("not switching focus since in menus");
      return;
    }

    const playerResult = gameStore.getExpectedClientPlayer();

    const firstOwnedCharacterId = playerResult.characterIds[0];
    if (!firstOwnedCharacterId) return console.error("Player doesn't own any characters");

    gameStore.setFocusedCharacter(firstOwnedCharacterId);
  }

  updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker: TurnTracker) {
    const party = AppStore.get().gameStore.getExpectedParty();

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
        AppStore.get().gameStore.setFocusedCharacter(
          newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId
        );
      }
    }
  }
}

export const characterAutoFocusManager = new CharacterAutoFocusManager();
