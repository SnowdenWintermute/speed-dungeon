import { Combatant, ERROR_MESSAGES, addCharacterToParty } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { useGameStore } from "@/stores/game-store";

export default async function characterAddedToPartyHandler(
  partyName: string,
  username: string,
  character: Combatant
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    try {
      addCharacterToParty(game, player, character);
    } catch (error) {
      if (error instanceof Error) setAlert(error.message);
      else console.error(error);
    }
  });
}
