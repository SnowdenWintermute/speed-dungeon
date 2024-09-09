import { AlertState } from "@/stores/alert-store";
import {
  ERROR_MESSAGES,
  removeFromArray,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";

export default function characterDeletionHandler(
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  partyName: string,
  username: string,
  characterId: string
) {
  mutateGameStore((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    removeFromArray(player.characterIds, characterId);
    delete party.characters[characterId];
    removeFromArray(party.characterPositions, characterId);

    for (const character of Object.values(party.characters))
      updateCombatantHomePosition(
        character.entityProperties.id,
        character.combatantProperties,
        party
      );
  });
}
