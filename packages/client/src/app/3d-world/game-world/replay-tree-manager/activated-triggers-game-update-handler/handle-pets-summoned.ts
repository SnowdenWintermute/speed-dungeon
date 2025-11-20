import { getGameWorld } from "@/app/3d-world/SceneManager";
import {
  AdventuringParty,
  PetSlot,
  SkeletalAnimationName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { spawnCharacterModel } from "../../model-manager/model-action-handlers/spawn-modular-character";

export function handlePetSlotsSummoned(
  petSlotsSummoned: PetSlot[],
  party: AdventuringParty,
  game: SpeedDungeonGame
) {
  const battleOption = party.getBattleOption(game);

  for (const { ownerId, slotIndex } of petSlotsSummoned) {
    const pet = party.petManager.summonPetFromSlot(party, ownerId, slotIndex, battleOption);
    spawnCharacterModel(getGameWorld(), {
      combatant: pet,
      homeRotation: pet.getHomeRotation(),
      homePosition: pet.getHomePosition(),
      modelDomPositionElement: null, // vestigial from when we used to spawn directly from next.js
    }).then((model) => {
      if (model instanceof Error) {
        throw model;
      }
      getGameWorld().modelManager.combatantModels[pet.getEntityId()] = model;

      model.skeletalAnimationManager.startAnimationWithTransition(
        SkeletalAnimationName.OnSummoned,
        500,
        {
          onComplete: () => {
            model.startIdleAnimation(500);
          },
        }
      );
    });
  }

  party.getBattleOption(game)?.turnOrderManager.updateTrackers(game, party);
}
