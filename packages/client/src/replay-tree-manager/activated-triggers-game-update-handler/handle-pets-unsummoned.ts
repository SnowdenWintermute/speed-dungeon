import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { synchronizeCombatantModelsWithAppState } from "@/game-world-view/model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import {
  AdventuringParty,
  EntityId,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export function handlePetSlotsUnsummoned(
  petsUnsummoned: EntityId[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const { petManager } = party;
  for (const petId of petsUnsummoned) {
    const modelOption = getGameWorldView().modelManager.combatantModels[petId];

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
