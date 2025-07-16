import { CombatantTurnTracker, ConditionTurnTracker, EntityId } from "@speed-dungeon/common";

export class CharacterAutoFocusManager {
  mostRecentlyActivePlayerCombatantId: null | EntityId = null;
  constructor() {}

  updateFocusedCharacterOnNewTurnOrder(
    newlyActiveTracker: CombatantTurnTracker | ConditionTurnTracker
  ) {
    // On Turn End
    // if viewing menu other than ItemsOnGround, do nothing
    // if newly active actor is player character AND is currently focusing the previously
    // most recently active player character
    // - change focus to newly active
    //
  }

  updateFocusedCharacterOnBattleEnd() {
    // on battle end, focus first owned character
  }

  updateFocusedCharacterOnBattleStart() {
    // on battle start, focus active character if any (not enemy going first)
  }
}
