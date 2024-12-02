import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  addCharacterToParty,
  getProgressionGamePartyName,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";

export default function savedCharacterSelectionInProgressGameHandler(
  username: string,
  character: { combatant: Combatant; deepestFloorReached: number }
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    game.selectedStartingFloor.max = character.deepestFloorReached;
    const partyName = getProgressionGamePartyName(game.name);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    const previouslySelectedCharacterId = player.characterIds[0];
    if (previouslySelectedCharacterId) {
      const removedCharacterResult = AdventuringParty.removeCharacter(
        party,
        previouslySelectedCharacterId,
        player
      );
      if (removedCharacterResult instanceof Error) return setAlert(removedCharacterResult.message);
      for (const character of Object.values(party.characters))
        updateCombatantHomePosition(
          character.entityProperties.id,
          character.combatantProperties,
          party
        );
    }

    addCharacterToParty(game, player, character.combatant);
  });
}
