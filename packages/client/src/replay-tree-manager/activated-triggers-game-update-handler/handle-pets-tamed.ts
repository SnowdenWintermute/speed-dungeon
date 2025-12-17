import {
  AdventuringParty,
  EntityId,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import { getGameWorldView } from "@/game-world-view/SceneManager";

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
