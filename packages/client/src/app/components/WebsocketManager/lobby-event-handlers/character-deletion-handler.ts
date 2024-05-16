import { GameState } from "@/stores/game-store";
import { ERROR_MESSAGES, removeFromArray } from "@speed-dungeon/common";

export default function characterDeletionHandler(
  mutateGameStore: (fn: (state: GameState) => void) => void,
  partyName: string,
  username: string,
  characterId: string
) {
  mutateGameStore((gameState) => {
    console.log("deleting character ", characterId, " for username ", username);
    const game = gameState.game;
    if (!game) return errorHandler(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return errorHandler(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return errorHandler(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    delete player.characterIds[characterId];
    delete party.characters[characterId];
    removeFromArray(party.characterPositions, characterId);
  });
}
