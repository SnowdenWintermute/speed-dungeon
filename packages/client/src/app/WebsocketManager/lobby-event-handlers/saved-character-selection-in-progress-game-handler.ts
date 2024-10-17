import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  addCharacterToParty,
  getProgressionGamePartyName,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";

export default function savedCharacterSelectionInProgressGameHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  username: string,
  character: Combatant
) {
  mutateGameState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const partyName = getProgressionGamePartyName(game.name);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    const previouslySelectedCharacterId = player.characterIds[0];
    if (previouslySelectedCharacterId) {
      AdventuringParty.removeCharacter(party, previouslySelectedCharacterId, player);
      for (const character of Object.values(party.characters))
        updateCombatantHomePosition(
          character.entityProperties.id,
          character.combatantProperties,
          party
        );
    }

    addCharacterToParty(game, player, character);
  });
}
