import { getGameWorld } from "@/app/3d-world/SceneManager";
import { GameState } from "@/stores/game-store";
import {
  AdventuringParty,
  CombatantProperties,
  DurabilityChangesByEntityId,
  EntityId,
  Equipment,
  EquipmentSlotType,
} from "@speed-dungeon/common";

export function handleDurabilityChanges(
  durabilityChanges: DurabilityChangesByEntityId,
  party: AdventuringParty,
  gameState: GameState,
  brokenHoldablesAndTheirOwnerIds: { ownerId: EntityId; equipment: Equipment }[]
) {
  gameState.rerenderForcer += 1; // for some reason it delays updating the durability indicators on bow use without this
  // playBeep();
  DurabilityChangesByEntityId.ApplyToGame(party, durabilityChanges, (combatant, equipment) => {
    const slot = CombatantProperties.getSlotItemIsEquippedTo(
      combatant.combatantProperties,
      equipment.entityProperties.id
    );
    // remove the model if it broke
    // @TODO - if this causes bugs because it is jumping the queue, look into it
    // if we use the queue though, it will wait to break their model and not look like it broke instantly
    // maybe we can set visibilty instead and despawn it later
    const justBrokeHoldable =
      Equipment.isBroken(equipment) && slot?.type === EquipmentSlotType.Holdable;
    if (justBrokeHoldable) {
      const characterModelOption = getGameWorld().modelManager.findOneOptional(
        combatant.entityProperties.id
      );

      brokenHoldablesAndTheirOwnerIds.push({
        ownerId: combatant.entityProperties.id,
        equipment,
      });

      characterModelOption?.equipmentModelManager.synchronizeCombatantEquipmentModels();
    }
  });
}
