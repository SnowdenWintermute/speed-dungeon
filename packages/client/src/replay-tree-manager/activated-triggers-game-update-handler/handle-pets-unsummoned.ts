import {
  AdventuringParty,
  EntityId,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import { getGameWorld } from "@/app/3d-world/SceneManager";

export function handlePetSlotsUnsummoned(
  petsUnsummoned: EntityId[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const { petManager } = party;
  for (const petId of petsUnsummoned) {
    const modelOption = getGameWorld().modelManager.combatantModels[petId];

    if (modelOption?.getCombatant().combatantProperties.isDead()) {
      petManager.unsummonPet(petId, game);
      synchronizeCombatantModelsWithAppState({ softCleanup: true });
    } else {
      modelOption?.skeletalAnimationManager.startAnimationWithTransition(
        SkeletalAnimationName.OnSummoned,
        500,
        {
          onComplete: () => {
            petManager.unsummonPet(petId, game);
            synchronizeCombatantModelsWithAppState({ softCleanup: true });
          },
        }
      );
    }
  }
}
