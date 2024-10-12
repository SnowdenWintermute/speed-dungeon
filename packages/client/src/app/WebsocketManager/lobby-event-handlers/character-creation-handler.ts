import { Combatant, ERROR_MESSAGES, updateCombatantHomePosition } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";

export default function characterCreationHandler(
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

    const characterId = character.entityProperties.id;

    party.characters[characterId] = character;
    party.characterPositions.push(characterId);
    player.characterIds.push(characterId);

    for (const character of Object.values(party.characters))
      updateCombatantHomePosition(
        character.entityProperties.id,
        character.combatantProperties,
        party
      );
  });
}
