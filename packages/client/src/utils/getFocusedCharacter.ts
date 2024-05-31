import { GameState } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export default function getFocusedCharacter(gameState: GameState) {
  if (!gameState.game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const partyOption = gameState.getCurrentParty(gameState.username);
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const characterOption = partyOption.characters[gameState.focusedCharacterId];
  if (!characterOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  return characterOption;
}
