import { getGameWorld } from "@/app/3d-world/SceneManager";
import {
  AdventuringParty,
  PetSlot,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";

export function handlePetSlotsSummoned(
  petSlotsSummoned: PetSlot[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const battleOption = party.getBattleOption(game);

  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    const pet = party.petManager.summonPetFromSlot(game, party, ownerId, slotIndex, battleOption);

    synchronizeCombatantModelsWithAppState({
      onComplete: () => {
        const modelOption = getGameWorld().modelManager.combatantModels[pet.getEntityId()];

        if (!pet.combatantProperties.isDead()) {
          modelOption?.skeletalAnimationManager.startAnimationWithTransition(
            SkeletalAnimationName.OnSummoned,
            500,
            {
              onComplete: () => {
                modelOption.startIdleAnimation(500);
              },
            }
          );
        }
      },
    });
  }
}
