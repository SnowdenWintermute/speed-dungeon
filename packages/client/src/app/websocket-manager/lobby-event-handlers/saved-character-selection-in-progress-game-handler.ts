import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import {
  Combatant,
  ERROR_MESSAGES,
  addCharacterToParty,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";

export function savedCharacterSelectionInProgressGameHandler(
  username: string,
  character: Combatant
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));

    game.lowestStartingFloorOptionsBySavedCharacter[character.entityProperties.id] =
      character.combatantProperties.deepestFloorReached;

    const partyName = getProgressionGamePartyName(game.name);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
    const player = game.players[username];
    if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));

    const previouslySelectedCharacterId = player.characterIds[0];
    if (previouslySelectedCharacterId) {
      try {
        const removedCharacterResult = party.removeCharacter(previouslySelectedCharacterId, player);
        delete game.lowestStartingFloorOptionsBySavedCharacter[
          removedCharacterResult.entityProperties.id
        ];
        party.combatantManager.updateHomePositions();
      } catch (err) {
        return setAlert(err as Error);
      }
    }

    const deserialized = Combatant.getDeserialized(character);

    addCharacterToParty(game, party, player, deserialized, []);

    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });

    throw new Error("not implemented - loading pets");
  });
}
