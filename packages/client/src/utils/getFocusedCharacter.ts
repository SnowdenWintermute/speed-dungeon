import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import getCurrentParty from "./getCurrentParty";

export function getFocusedCharacter() {
  const gameState = useGameStore.getState();
  if (!gameState.game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const partyOption = getCurrentParty(gameState, gameState.username);
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const characterOption = partyOption.combatantManager.getCombatantOption(
    gameState.focusedCharacterId
  );
  if (!characterOption) return new Error(ERROR_MESSAGES.GAME.CHARACTER_DOES_NOT_EXIST);
  return characterOption;
}
