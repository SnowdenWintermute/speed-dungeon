import { gameWorld } from "@/game-world-view/SceneManager";
import { ModelActionType } from "@/game-world-view/game-world/model-manager/model-actions";
import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { Combatant, ERROR_MESSAGES, getProgressionGamePartyName } from "@speed-dungeon/common";

export function savedCharacterSelectionInProgressGameHandler(
  username: string,
  character: { combatant: Combatant; pets: Combatant[] }
) {
  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();

  const deserialized = {
    combatant: Combatant.getDeserialized(character.combatant),
    pets: character.pets.map((pet) => Combatant.getDeserialized(pet)),
  };

  game.lowestStartingFloorOptionsBySavedCharacter[character.combatant.entityProperties.id] =
    character.combatant.combatantProperties.deepestFloorReached;

  const partyName = getProgressionGamePartyName(game.name);
  const party = game.adventuringParties[partyName];
  if (!party) return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
  const player = game.players[username];
  if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));

  const previouslySelectedCharacterId = player.characterIds[0];
  if (previouslySelectedCharacterId) {
    try {
      const removedCharacterResult = party.removeCharacter(
        previouslySelectedCharacterId,
        player,
        game
      );
      delete game.lowestStartingFloorOptionsBySavedCharacter[
        removedCharacterResult.entityProperties.id
      ];
      party.combatantManager.updateHomePositions();
    } catch (err) {
      return setAlert(err as Error);
    }
  }

  game.addCharacterToParty(party, player, deserialized.combatant, deserialized.pets);

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
    placeInHomePositions: true,
  });
}
