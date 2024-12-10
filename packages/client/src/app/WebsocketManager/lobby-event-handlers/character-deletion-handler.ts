import {
  AdventuringParty,
  ERROR_MESSAGES,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { useGameStore } from "@/stores/game-store";

export default function characterDeletionHandler(
  partyName: string,
  username: string,
  characterId: string
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    AdventuringParty.removeCharacter(party, characterId, player, undefined);

    for (const character of Object.values(party.characters))
      updateCombatantHomePosition(
        character.entityProperties.id,
        character.combatantProperties,
        party
      );
  });
}
