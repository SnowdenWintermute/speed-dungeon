import { getGameWorld } from "@/app/3d-world/SceneManager";
import {
  AdventuringParty,
  PetSlot,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { spawnCharacterModel } from "../../model-manager/model-action-handlers/spawn-modular-character";
import { AppStore } from "@/mobx-stores/app-store";
import { synchronizeCombatantModelsWithAppState } from "../../model-manager/model-action-handlers/synchronize-combatant-models-with-app-state";

export function handlePetSlotsSummoned(
  petSlotsSummoned: PetSlot[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const battleOption = party.getBattleOption(game);

  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    const pet = party.petManager.summonPetFromSlot(party, ownerId, slotIndex, battleOption);

    synchronizeCombatantModelsWithAppState(() => {
      const modelOption = getGameWorld().modelManager.combatantModels[pet.getEntityId()];
      modelOption?.skeletalAnimationManager.startAnimationWithTransition(
        SkeletalAnimationName.OnSummoned,
        500,
        {
          onComplete: () => {
            modelOption.startIdleAnimation(500);
          },
        }
      );
    });
  }

  party.getBattleOption(game)?.turnOrderManager.updateTrackers(game, party);
}
