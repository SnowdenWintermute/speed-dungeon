import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AdventuringParty, PetSlot, SpeedDungeonGame } from "@speed-dungeon/common";
import { ModelActionType } from "../../model-manager/model-actions";

export function handlePetSlotsSummoned(
  petSlotsSummoned: PetSlot[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const battleOption = party.getBattleOption(game);

  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    party.petManager.summonPetFromSlot(party, ownerId, slotIndex, battleOption);
  }

  getGameWorld().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });
}
