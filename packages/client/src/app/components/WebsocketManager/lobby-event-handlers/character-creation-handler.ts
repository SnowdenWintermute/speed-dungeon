import { GameState } from "@/stores/game-store";
import { ERROR_MESSAGES, PlayerCharacter } from "@speed-dungeon/common";

export default function characterCreationHandler(
  mutateGameStore: (fn: (state: GameState) => void) => void,
  partyName: string,
  username: string,
  character: PlayerCharacter
) {
  mutateGameStore((gameState) => {
    const game = gameState.game;
    if (!game) return errorHandler(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return errorHandler(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return errorHandler(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    const characterId = character.entityProperties.id;
    party.characters[characterId] = character;
    party.characterPositions.push(characterId);
    player.characterIds[characterId] = null;
  });
}
