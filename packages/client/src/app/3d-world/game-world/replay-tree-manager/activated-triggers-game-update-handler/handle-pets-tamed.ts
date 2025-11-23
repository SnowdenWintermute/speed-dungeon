import {
  AdventuringParty,
  EntityId,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import { getGameWorld } from "@/app/3d-world/SceneManager";

export function handlePetsTamed(
  petsTamed: { petId: EntityId; tamerId: EntityId }[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  for (const { petId, tamerId } of petsTamed) {
    const modelOption = getGameWorld().modelManager.combatantModels[petId];
    modelOption?.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.OnSummoned,
      500,
      {
        onComplete: () => {
          party.petManager.handlePetTamed(petId, tamerId, game);
          synchronizeCombatantModelsWithAppState({ softCleanup: true });
        },
      }
    );
  }
}
