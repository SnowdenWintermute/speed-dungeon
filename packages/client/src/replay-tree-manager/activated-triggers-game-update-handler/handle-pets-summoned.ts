import { getGameWorldView } from "@/game-world-view/SceneManager";
import {
  AdventuringParty,
  PetSlot,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";
import { setAlert } from "@/app/components/alerts";

export function handlePetSlotsSummoned(
  petSlotsSummoned: PetSlot[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const battleOption = party.getBattleOption(game);

  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    const pet = party.petManager.summonPetFromSlot(game, party, ownerId, slotIndex, battleOption);

    if (pet === undefined) {
      setAlert("No pet was found even though server thought there should have been one");
      return console.warn("No pet was found even though server thought there should have been one");
    }

    synchronizeCombatantModelsWithAppState({
      onComplete: () => {
        const modelOption = getGameWorldView().modelManager.combatantModels[pet.getEntityId()];

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
