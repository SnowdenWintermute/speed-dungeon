import { GameState } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export default function getFocusedCharacter(gameState: GameState, username: string) {
  if (!gameState.game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  const partyOption = gameState.getCurrentParty(username);
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const characterOption = partyOption.characters[gameState.focusedCharacterId];
  if (!characterOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  return characterOption;
}
