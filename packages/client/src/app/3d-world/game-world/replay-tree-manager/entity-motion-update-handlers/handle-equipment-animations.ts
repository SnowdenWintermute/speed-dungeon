import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AnimationTimingType, AnimationType, EntityId } from "@speed-dungeon/common";
import { EquipmentAnimation } from "@speed-dungeon/common";

export function handleEquipmentAnimations(
  entityId: EntityId,
  equipmentAnimations: EquipmentAnimation[]
) {
  const combatantModelOption = getGameWorld().modelManager.findOne(entityId);

  for (const equipmentAnimation of equipmentAnimations) {
    const { slot, animation } = equipmentAnimation;

    const equipmentModel = combatantModelOption.equipmentModelManager.getEquipmentModelInSlot(slot);

    if (!equipmentModel) return console.log("couldn't find equipment");
    if (animation.name.type !== AnimationType.Skeletal) return console.log("not skeletal");

    equipmentModel.skeletalAnimationManager.startAnimationWithTransition(
      animation.name.name,
      animation.timing.type === AnimationTimingType.Timed ? animation.timing.duration : 0,
      {}
    );
  }
}
