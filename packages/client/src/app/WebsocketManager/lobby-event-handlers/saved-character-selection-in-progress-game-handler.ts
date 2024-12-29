import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  Combatant,
  CombatantEquipment,
  ERROR_MESSAGES,
  addCharacterToParty,
  getProgressionGamePartyName,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";

export default function savedCharacterSelectionInProgressGameHandler(
  username: string,
  character: Combatant
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));

    CombatantEquipment.instatiateItemClasses(character.combatantProperties);

    game.lowestStartingFloorOptionsBySavedCharacter[character.entityProperties.id] =
      character.combatantProperties.deepestFloorReached;

    const partyName = getProgressionGamePartyName(game.name);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
    const player = game.players[username];
    if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));

    const previouslySelectedCharacterId = player.characterIds[0];
    if (previouslySelectedCharacterId) {
      const removedCharacterResult = AdventuringParty.removeCharacter(
        party,
        previouslySelectedCharacterId,
        player,
        undefined
      );
      if (removedCharacterResult instanceof Error) return setAlert(removedCharacterResult);

      delete game.lowestStartingFloorOptionsBySavedCharacter[
        removedCharacterResult.entityProperties.id
      ];

      for (const character of Object.values(party.characters))
        updateCombatantHomePosition(
          character.entityProperties.id,
          character.combatantProperties,
          party
        );
    }

    addCharacterToParty(game, player, character);

    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });
  });
}
