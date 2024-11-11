import { Combatant, ERROR_MESSAGES, addCharacterToParty } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";

export default function characterAddedToPartyHandler(
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  partyName: string,
  username: string,
  character: Combatant
) {
  mutateGameStore((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    try {
      addCharacterToParty(game, player, character);
    } catch (error) {
      if (error instanceof Error) setAlert(mutateAlertStore, error.message);
      else console.error(error);
    }
  });
}
