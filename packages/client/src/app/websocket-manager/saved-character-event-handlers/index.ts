import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import { AppStore } from "@/mobx-stores/app-store";
import {
  ClientToServerEventTypes,
  Combatant,
  EntityId,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function setUpSavedCharacterEventListeners(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const lobbyStore = AppStore.get().lobbyStore;

  socket.on(ServerToClientEvent.SavedCharacterList, (characters) => {
    const deserialized: Record<number, null | { combatant: Combatant; pets: Combatant[] }> = {};
    for (const [slotNumberStringKey, characterOption] of Object.entries(characters)) {
      const slotNumber = parseInt(slotNumberStringKey);
      if (characterOption === null) {
        deserialized[slotNumber] = null;
      } else {
        deserialized[slotNumber] = {
          combatant: Combatant.getDeserialized(characterOption.combatant),
          pets: characterOption.pets.map((pet) => Combatant.getDeserialized(pet)),
        };
      }
    }

    lobbyStore.setSavedCharacterSlots(deserialized);

    gameWorld.current?.drawCharacterSlots();

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
      placeInHomePositions: true,
    });
  });

  socket.on(ServerToClientEvent.SavedCharacterDeleted, (entityId: EntityId) => {
    lobbyStore.deleteSavedCharacter(entityId);

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
      placeInHomePositions: true,
    });
  });

  socket.on(ServerToClientEvent.SavedCharacter, (character, slot) => {
    const { combatant, pets } = character;
    const deserializedCombatant = Combatant.getDeserialized(combatant);
    const deserializedPets = pets.map((pet) => Combatant.getDeserialized(pet));

    lobbyStore.setSavedCharacterSlot(
      { combatant: deserializedCombatant, pets: deserializedPets },
      slot
    );
    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
      placeInHomePositions: true,
    });
  });
}
