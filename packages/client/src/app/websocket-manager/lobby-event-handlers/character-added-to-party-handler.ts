import { Combatant, GameMode, addCharacterToParty } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

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

    addCharacterToParty(game, party, player, deserialized, deserializedPets);
  } catch (error) {
    if (error instanceof Error) setAlert(error.message);
    else console.error(error);
  }

  if (game.mode === GameMode.Progression) {
    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });
  }
}
