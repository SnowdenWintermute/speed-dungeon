import { getGameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import {
  AnimationTimingType,
  AnimationType,
  CombatantEquipment,
  EntityId,
  EquipmentSlotType,
} from "@speed-dungeon/common";
import { EquipmentAnimation } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-steps-config";

export function handleEquipmentAnimations(
  entityId: EntityId,
  equipmentAnimations: EquipmentAnimation[]
) {
  const combatantModelOption = getGameWorld().modelManager.findOne(entityId);

  for (const equipmentAnimation of equipmentAnimations) {
    const { slot, animation } = equipmentAnimation;
    const equipment = (() => {
      const combatant = useGameStore.getState().getCombatant(entityId);

      if (combatant instanceof Error) throw combatant;
      const equipment = CombatantEquipment.getEquipmentInSlot(combatant.combatantProperties, slot);
      if (!equipment) return undefined;
      else {
        switch (slot.type) {
          case EquipmentSlotType.Holdable:
            return combatantModelOption.equipment.holdables[slot.slot];
          case EquipmentSlotType.Wearable:
            return combatantModelOption.equipment.wearables[slot.slot];
        }
      }
    })();

    if (!equipment) return console.log("couldn't find equipment");
    if (animation.name.type !== AnimationType.Skeletal) return console.log("not skeletal");

    equipment.skeletalAnimationManager.startAnimationWithTransition(
      animation.name.name,
      animation.timing.type === AnimationTimingType.Timed ? animation.timing.duration : 0,
      {}
    );
  }
}
