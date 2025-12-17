import { AdventuringParty, PetSlot } from "@speed-dungeon/common";

export function handlePetSlotsReleased(petSlotsSummoned: PetSlot[], party: AdventuringParty) {
  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    party.petManager.releasePetInSlot(ownerId, slotIndex);
  }
}
