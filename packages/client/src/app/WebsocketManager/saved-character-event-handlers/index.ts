import { gameWorld } from "@/app/3d-world/SceneManager";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEventTypes,
  CombatantEquipment,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpSavedCharacterEventListeners(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateLobbyState = useLobbyStore.getState().mutateState;
  socket.on(ServerToClientEvent.SavedCharacterList, (characters) => {
    for (const character of Object.values(characters)) {
      if (character !== null)
        CombatantEquipment.instatiateItemClasses(character.combatantProperties);
    }

    gameWorld.current?.drawCharacterSlots();
    mutateLobbyState((state) => {
      state.savedCharacters = characters;
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
    CombatantEquipment.instatiateItemClasses(character.combatantProperties);
    mutateLobbyState((state) => {
      state.savedCharacters[slot] = character;
    });
  });
}
