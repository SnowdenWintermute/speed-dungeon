import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { synchronizeCombatantModelsWithAppState } from "@/game-world-view/model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import {
  AdventuringParty,
  EntityId,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export function handlePetsTamed(
  petsTamed: { petId: EntityId; tamerId: EntityId }[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  for (const { petId, tamerId } of petsTamed) {
    party.petManager.handlePetTamed(petId, tamerId, game);
    const modelOption = getGameWorldView().modelManager.combatantModels[petId];
    modelOption?.skeletalAnimationManager.startAnimationWithTransition(
      SkeletalAnimationName.OnSummoned,
      500,
      {
        onComplete: () => {
          synchronizeCombatantModelsWithAppState({ softCleanup: true });
        },
      }
    );
  }
}
