import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEventTypes,
  Combatant,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpSavedCharacterEventListeners(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateLobbyState = useLobbyStore.getState().mutateState;
  socket.on(ServerToClientEvent.SavedCharacterList, (characters) => {
    for (const [slotNumber, character] of Object.entries(characters)) {
      if (character !== null)
        characters[parseInt(slotNumber)] = Combatant.getDeserialized(character);
    }

    gameWorld.current?.drawCharacterSlots();
    mutateLobbyState((state) => {
      state.savedCharacters = characters;
    });

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });
  });

  socket.on(ServerToClientEvent.SavedCharacterDeleted, (id) => {
    mutateLobbyState((state) => {
      for (const [slot, character] of Object.entries(state.savedCharacters)) {
        const slotAsNumber = parseInt(slot);
        if (character?.entityProperties.id === id) {
          state.savedCharacters[slotAsNumber] = null;
          break;
        }
      }
    });
  });

  socket.on(ServerToClientEvent.SavedCharacter, (character, slot) => {
    mutateLobbyState((state) => {
      state.savedCharacters[slot] = Combatant.getDeserialized(character);
    });
  });
}
