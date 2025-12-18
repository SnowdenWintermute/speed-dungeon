import { Combatant, GameMode } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";

export async function characterAddedToPartyHandler(
  username: string,
  character: Combatant,
  pets: Combatant[]
) {
  const { gameStore } = AppStore.get();
  const { game, party, player } = gameStore.getExpectedPlayerContext(username);

  try {
    const deserialized = Combatant.getDeserialized(character);

    const deserializedPets: Combatant[] = [];
    for (const pet of pets) {
      const deserializedPet = Combatant.getDeserialized(pet);
      deserializedPets.push(deserializedPet);
    }

    game.addCharacterToParty(party, player, deserialized, deserializedPets);
  } catch (error) {
    if (error instanceof Error) {
      setAlert(error.message);
      console.trace(error);
    } else console.error(error);
  }

  if (game.mode === GameMode.Progression) {
    gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
      placeInHomePositions: true,
    });
  }
}
