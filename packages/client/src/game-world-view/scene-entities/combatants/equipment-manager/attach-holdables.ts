import { AbstractMesh } from "@babylonjs/core";
import {
  CombatantBaseChildTransformNodeName,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { CombatantSceneEntity } from "..";
import { EquipmentSceneEntity } from "../../items/equipment-scene-entity";
import {
  getChildMeshByName,
  setTransformNodePositionAndRotationToZero,
} from "@/game-world-view/utils";

const HIP_HOLSTERED_WEAPONS: OneHandedMeleeWeapon[] = [
  OneHandedMeleeWeapon.ButterKnife,
  OneHandedMeleeWeapon.Dagger,
];

// @TODO - conform to new SceneEntityChildTransformNode style instead of directly to bones

export class HoldableAttacher {
  private skeletonRoot: AbstractMesh;
  constructor(private combatantSceneEntity: CombatantSceneEntity) {
    this.skeletonRoot = this.combatantSceneEntity.rootMesh;
  }

  attachToHoldableSlot(equipmentSceneEntity: EquipmentSceneEntity, slot: HoldableSlotType) {
    const attachmentPointOption = this.getWieldedAttachmentPoint(equipmentSceneEntity, slot);
    if (!attachmentPointOption) return console.error("no equipment bone found");
    const attachmentPoint = attachmentPointOption;
    const itemTransformNode = equipmentSceneEntity.rootTransformNode;

    itemTransformNode.setParent(attachmentPoint);
    setTransformNodePositionAndRotationToZero(itemTransformNode);

    this.adjustWieldedPosition(equipmentSceneEntity, slot);
  }

  private getWieldedAttachmentPoint(
    equipmentSceneEntity: EquipmentSceneEntity,
    slot: HoldableSlotType
  ) {
    const { equipment } = equipmentSceneEntity;
    const { childTransformNodes } = this.combatantSceneEntity;

    if (slot === HoldableSlotType.OffHand) {
      return childTransformNodes[CombatantBaseChildTransformNodeName.OffhandEquipment];
    } else {
      const isRangedWeapon = equipment.isRangedWeapon();
      if (isRangedWeapon) {
        return childTransformNodes[CombatantBaseChildTransformNodeName.OffhandEquipment];
      } else {
        return childTransformNodes[CombatantBaseChildTransformNodeName.MainHandEquipment];
      }
    }
  }

  private adjustWieldedPosition(
    equipmentSceneEntity: EquipmentSceneEntity,
    slot: HoldableSlotType
  ) {
    const { rootTransformNode, equipment } = equipmentSceneEntity;
    rootTransformNode.rotation.z = Math.PI;

    const { equipmentType } = equipment.equipmentBaseItemProperties;

    if (slot === HoldableSlotType.OffHand) {
      rootTransformNode.rotation.y = Math.PI;
    }

    if (equipmentType === EquipmentType.Shield) {
      rootTransformNode.position.z = -0.08;
      rootTransformNode.position.x = -0.15;
    }

    if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      rootTransformNode.rotation.y = Math.PI;
    }
  }

  attachToHolstered(equipmentSceneEntity: EquipmentSceneEntity, slot: HoldableSlotType) {
    console.log("attaching to holstered");
    const holsterAtHip = this.shouldHolsterAtHip(equipmentSceneEntity);
    if (holsterAtHip) {
      this.attachToHip(equipmentSceneEntity, slot);
    } else {
      this.attachToBack(equipmentSceneEntity, slot);
    }
  }

  private attachToHip(equipmentSceneEntity: EquipmentSceneEntity, slot: HoldableSlotType) {
    const { rootTransformNode } = equipmentSceneEntity;
    const hipHolsterBoneName = slot === HoldableSlotType.OffHand ? "HipHolster.L" : "HipHolster.R";
    const holsterBone = getChildMeshByName(this.skeletonRoot, hipHolsterBoneName);
    if (holsterBone === undefined) {
      throw new Error("expected holster bones missing");
    }
    rootTransformNode.setParent(holsterBone);
    setTransformNodePositionAndRotationToZero(rootTransformNode);
    rootTransformNode.rotation.y = -Math.PI / 2 - Math.PI;
    rootTransformNode.rotation.x = Math.PI;
    console.log(rootTransformNode.name, "set parent to ", holsterBone.name);
  }

  private attachToBack(equipmentSceneEntity: EquipmentSceneEntity, slot: HoldableSlotType) {
    const { rootTransformNode } = equipmentSceneEntity;
    const { equipmentType } = equipmentSceneEntity.equipment.equipmentBaseItemProperties;

    const backHolsterBoneName =
      slot === HoldableSlotType.OffHand ? "BackHolster.L" : "BackHolster.R";
    const holsterBone = getChildMeshByName(this.skeletonRoot, backHolsterBoneName);
    if (holsterBone === undefined) {
      throw new Error("expected holster bones missing");
    }
    rootTransformNode.setParent(holsterBone);
    setTransformNodePositionAndRotationToZero(rootTransformNode);
    if (equipmentType === EquipmentType.Shield) {
      // rootTransformNode.rotation.y = Math.PI;
      rootTransformNode.rotation.z = Math.PI;
      rootTransformNode.position.y = 0.15;
      rootTransformNode.position.z = -0.05;
    } else if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      rootTransformNode.position.y = 0.18;
      rootTransformNode.position.x = 0.07;
      rootTransformNode.rotation.y = Math.PI;
    } else {
      // move most weapons up a little
      rootTransformNode.position.y = -0.15;
    }
    rootTransformNode.rotation.x = Math.PI;
  }

  private shouldHolsterAtHip(equipmentSceneEntity: EquipmentSceneEntity) {
    const { taggedBaseEquipment } = equipmentSceneEntity.equipment.equipmentBaseItemProperties;
    const { equipmentType, baseItemType } = taggedBaseEquipment;

    return (
      equipmentType === EquipmentType.OneHandedMeleeWeapon &&
      HIP_HOLSTERED_WEAPONS.includes(baseItemType)
    );
  }
}
