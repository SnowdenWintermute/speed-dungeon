import { TransformNode, Vector3 } from "@babylonjs/core";
import {
  CombatantBaseChildTransformNodeName,
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { CharacterModel } from "../index";
import { getChildMeshByName } from "../../../utils";
import { EquipmentModel } from "../../item-models";

function setTransformNodePositionAndRotationToZero(transformNode: TransformNode) {
  setTransformNodeRotationToZero(transformNode);
  transformNode.setPositionWithLocalVector(Vector3.Zero());
}

function setTransformNodeRotationToZero(transformNode: TransformNode) {
  transformNode.rotationQuaternion = null;
  transformNode.rotation = Vector3.Zero();
}

export function attachHoldableModelToSkeleton(
  combatantModel: CharacterModel,
  equipmentModel: EquipmentModel,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const itemTransformNode = equipmentModel.rootTransformNode;

  let attachmentPointName: CombatantBaseChildTransformNodeName;

  const { equipmentType } = equipment.equipmentBaseItemProperties;

  if (slot === HoldableSlotType.OffHand) {
    attachmentPointName = CombatantBaseChildTransformNodeName.OffhandEquipment;
  } else {
    const isBow =
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon;
    if (isBow) attachmentPointName = CombatantBaseChildTransformNodeName.OffhandEquipment;
    else attachmentPointName = CombatantBaseChildTransformNodeName.MainHandEquipment;
  }

  const attachmentPoint = combatantModel.childTransformNodes[attachmentPointName];

  console.log("attachment point", attachmentPoint);

  if (!attachmentPoint) return console.log("no equipment bone found");

  itemTransformNode.setParent(attachmentPoint);

  setTransformNodePositionAndRotationToZero(itemTransformNode);

  itemTransformNode.rotation.z = Math.PI;

  if (slot === HoldableSlotType.OffHand) {
    itemTransformNode.rotation.y = Math.PI;

    if (equipmentType === EquipmentType.Shield) {
      itemTransformNode.position.z = -0.08;
      itemTransformNode.position.x = -0.15;
    }
  }

  if (equipmentType === EquipmentType.TwoHandedRangedWeapon) itemTransformNode.rotation.y = Math.PI;
}

export function attachHoldableModelToHolsteredPosition(
  combatantModel: CharacterModel,
  equipmentModel: EquipmentModel,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const equipmentTransformNode = equipmentModel.rootTransformNode;
  const skeletonRoot = combatantModel.getSkeletonRoot();

  const backHolsterBoneName = slot === HoldableSlotType.OffHand ? "BackHolster.L" : "BackHolster.R";
  const hipHolsterBoneName = slot === HoldableSlotType.OffHand ? "HipHolster.L" : "HipHolster.R";
  const holsterBackBone = getChildMeshByName(skeletonRoot, backHolsterBoneName);
  const holsterHipBone = getChildMeshByName(skeletonRoot, hipHolsterBoneName);
  if (!holsterBackBone || !holsterHipBone) throw new Error("expected holster bones missing");
  const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
  const { equipmentType, baseItemType } = taggedBaseEquipment;

  const holsterAtHip = shouldHolsterAtHip(taggedBaseEquipment);

  if (holsterAtHip) {
    equipmentTransformNode.setParent(holsterHipBone);
    setTransformNodePositionAndRotationToZero(equipmentTransformNode);
    equipmentTransformNode.rotation.y = -Math.PI / 2;
  } else {
    equipmentTransformNode.setParent(holsterBackBone);
    setTransformNodePositionAndRotationToZero(equipmentTransformNode);
    if (equipmentType === EquipmentType.Shield) {
      console.log("set parent to back");
      equipmentTransformNode.rotation.y = Math.PI;
      equipmentTransformNode.rotation.z = Math.PI;
      equipmentTransformNode.position.y = 0.15;
    } else if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      equipmentTransformNode.position.y = 0.18;
      equipmentTransformNode.position.x = 0.07;
      equipmentTransformNode.rotation.y = Math.PI;
    } else {
      // move most weapons up a little
      equipmentTransformNode.position.y = -0.15;
    }
  }
}

const HIP_HOLSTERED_WEAPONS: OneHandedMeleeWeapon[] = [
  OneHandedMeleeWeapon.ButterKnife,
  OneHandedMeleeWeapon.Dagger,
];

function shouldHolsterAtHip(taggedBaseEquipment: EquipmentBaseItem) {
  const { equipmentType, baseItemType } = taggedBaseEquipment;

  return (
    equipmentType === EquipmentType.OneHandedMeleeWeapon &&
    HIP_HOLSTERED_WEAPONS.includes(baseItemType)
  );
}
