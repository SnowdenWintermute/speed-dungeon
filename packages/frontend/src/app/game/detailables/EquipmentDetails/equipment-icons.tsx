import { EquipmentType } from "@speed-dungeon/common";
import SwordIcon from "../../../../../public/img/equipment-icons/sword.svg";
import ShieldIcon from "../../../../../public/img/equipment-icons/shield.svg";
import BowIcon from "../../../../../public/img/equipment-icons/bow.svg";
import BodyIcon from "../../../../../public/img/equipment-icons/body.svg";
import HeadGearIcon from "../../../../../public/img/equipment-icons/head-gear.svg";
import AmuletIcon from "../../../../../public/img/equipment-icons/amulet.svg";
import RingIcon from "../../../../../public/img/equipment-icons/ring-flattened.svg";
import { ReactNode } from "react";

export const EQUIPMENT_ICONS: Record<
  EquipmentType,
  (className: string, style: { [key: string]: string }) => ReactNode
> = {
  [EquipmentType.BodyArmor]: (className: string, style: { [key: string]: string }) => (
    <BodyIcon className={className} style={style} />
  ),
  [EquipmentType.HeadGear]: (className: string, style: { [key: string]: string }) => (
    <HeadGearIcon className={className} style={style} />
  ),
  [EquipmentType.Ring]: (className: string, style: { [key: string]: string }) => (
    <RingIcon className={className} style={style} />
  ),
  [EquipmentType.Amulet]: (className: string, style: { [key: string]: string }) => (
    <AmuletIcon className={className} style={style} />
  ),
  [EquipmentType.OneHandedMeleeWeapon]: (className: string, style: { [key: string]: string }) => (
    <SwordIcon className={className} style={style} />
  ),
  [EquipmentType.TwoHandedMeleeWeapon]: (className: string, style: { [key: string]: string }) => (
    <SwordIcon className={className} style={style} />
  ),
  [EquipmentType.TwoHandedRangedWeapon]: (className: string, style: { [key: string]: string }) => (
    <BowIcon className={className} style={style} />
  ),
  [EquipmentType.Shield]: (className: string, style: { [key: string]: string }) => (
    <ShieldIcon className={className} style={style} />
  ),
};
