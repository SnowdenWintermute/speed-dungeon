import { CombatantTurnTracker, ConditionTurnTracker, TurnTracker } from "@speed-dungeon/common";
import { GameState, getCurrentMenu, useGameStore } from "@/stores/game-store";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state";

export class CharacterAutoFocusManager {
  constructor() {}

  handleBattleStart(
    gameState: GameState,
    firstActiveTracker: CombatantTurnTracker | ConditionTurnTracker
  ) {
    if (firstActiveTracker instanceof CombatantTurnTracker) {
      const partyResult = gameState.getParty();
      if (partyResult instanceof Error) return console.error(partyResult.message);
      const party = partyResult;

      const newlyActiveTrackerIsPlayerControlled = party.characterPositions.includes(
        firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId
      );

      if (newlyActiveTrackerIsPlayerControlled)
        gameState.focusedCharacterId = firstActiveTracker.getTaggedIdOfTrackedEntity().combatantId;
    }
  }

  focusFirstOwnedCharacter(gameState: GameState) {
    // if viewing menu other than ItemsOnGround, do nothing
    const clientIsViewingMenus = gameState.stackedMenuStates.length;
    const currentMenu = getCurrentMenu(gameState);
    if (clientIsViewingMenus && currentMenu.type !== MenuStateType.ItemsOnGround) return;

    const playerResult = gameState.getPlayer();
    if (playerResult instanceof Error) throw playerResult;

    const firstOwnedCharacterId = playerResult.characterIds[0];
    if (!firstOwnedCharacterId) return console.error("Player doesn't own any characters");
    gameState.focusedCharacterId = firstOwnedCharacterId;
  }

  updateFocusedCharacterOnNewTurnOrder(gameState: GameState, newlyActiveTracker: TurnTracker) {
    const partyResult = gameState.getParty();
    if (partyResult instanceof Error) return console.error(partyResult.message);
    const party = partyResult;

    // if viewing menu other than ItemsOnGround, do nothing
    const clientIsViewingMenus = gameState.stackedMenuStates.length;
    const currentMenu = getCurrentMenu(gameState);
    if (clientIsViewingMenus && currentMenu.type !== MenuStateType.ItemsOnGround) return;

    let newlyActiveTrackerIsPlayerControlled = false;

    if (newlyActiveTracker instanceof CombatantTurnTracker) {
      newlyActiveTrackerIsPlayerControlled = party.characterPositions.includes(
        newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId
      );

      if (newlyActiveTrackerIsPlayerControlled)
        gameState.focusedCharacterId = newlyActiveTracker.getTaggedIdOfTrackedEntity().combatantId;
    }
  }
}

export const characterAutoFocusManager = new CharacterAutoFocusManager();
