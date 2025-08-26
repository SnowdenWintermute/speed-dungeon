import { IconName, SVG_ICONS } from "@/app/icons";
import { CombatActionName, CombatantTraitType } from "@speed-dungeon/common";
import { ReactNode } from "react";

export const TRAIT_ICONS: Record<CombatantTraitType, null | ((className: string) => ReactNode)> = {
  [CombatantTraitType.HpBioavailability]: (className: string) =>
    SVG_ICONS[IconName.BloodWithH](className),
  [CombatantTraitType.MpBioavailability]: null,
  [CombatantTraitType.Undead]: null,
  [CombatantTraitType.ExtraHotswapSlot]: null,
  [CombatantTraitType.CanConvertToShardsManually]: null,
  [CombatantTraitType.ExtraConsumablesStorage]: null,
};
