import { AdventuringParty, EntityId, SkeletalAnimationName } from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import { getGameWorld } from "@/app/3d-world/SceneManager";

export function handlePetSlotsUnsummoned(petsUnsummoned: EntityId[], party: AdventuringParty) {
  const { petManager } = party;
  for (const petId of petsUnsummoned) {
    const modelOption = getGameWorld().modelManager.combatantModels[petId];
    modelOption?.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.OnSummoned,
      500,
      {
        onComplete: () => {
          petManager.unsummonPet(party, petId);
          synchronizeCombatantModelsWithAppState();
        },
      }
    );
  }
}
