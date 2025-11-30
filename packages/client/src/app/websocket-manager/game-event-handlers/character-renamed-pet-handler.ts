import { EntityId } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { setAlert } from "@/app/components/alerts";

export function characterRenamedPetHandler(eventData: { petId: EntityId; newName: string }) {
  const { petId, newName } = eventData;
  const pet = AppStore.get().gameStore.getExpectedCombatant(petId);
  setAlert(`Pet name changed from ${pet.entityProperties.name} to ${newName}`);
  pet.entityProperties.name = newName;
}
