import { MutateAlertStore } from "@/stores/alert-store";
import { MutateGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, removeFromArray } from "@speed-dungeon/common";
import { setAlert } from "../../alerts";

export default function characterDeletionHandler(
  mutateGameStore: MutateGameStore,
  mutateAlertStore: MutateAlertStore,
  partyName: string,
  username: string,
  characterId: string
) {
  mutateGameStore((gameState) => {
    console.log("deleting character ", characterId, " for username ", username);
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    delete player.characterIds[characterId];
    delete party.characters[characterId];
    removeFromArray(party.characterPositions, characterId);
  });
}
