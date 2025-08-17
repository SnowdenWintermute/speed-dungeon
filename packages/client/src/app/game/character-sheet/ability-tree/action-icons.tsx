import { IconName, SVG_ICONS } from "@/app/icons";
import { CombatActionName } from "@speed-dungeon/common";
import { ReactNode } from "react";

export const ACTION_ICONS: Record<CombatActionName, null | ((className: string) => ReactNode)> = {
  [CombatActionName.Attack]: null,
  [CombatActionName.AttackMeleeMainhand]: null,
  [CombatActionName.AttackMeleeOffhand]: null,
  [CombatActionName.AttackRangedMainhand]: null,
  [CombatActionName.AttackRangedMainhandProjectile]: null,
  [CombatActionName.CounterAttackRangedMainhandProjectile]: null,
  [CombatActionName.Counterattack]: null,
  [CombatActionName.CounterattackMeleeMainhand]: null,
  [CombatActionName.CounterattackRangedMainhand]: null,
  [CombatActionName.ChainingSplitArrowParent]: null,
  [CombatActionName.ChainingSplitArrowProjectile]: null,
  [CombatActionName.ExplodingArrowParent]: null,
  [CombatActionName.ExplodingArrowProjectile]: null,
  [CombatActionName.Explosion]: null,
  [CombatActionName.IceBoltParent]: (className: string) => SVG_ICONS[IconName.Ice](className),
  [CombatActionName.IceBoltProjectile]: null,
  [CombatActionName.IceBurst]: null,
  [CombatActionName.Fire]: (className: string) => SVG_ICONS[IconName.Fire](className),
  [CombatActionName.BurningTick]: null,
  [CombatActionName.Healing]: (className: string) => SVG_ICONS[IconName.HealthCross](className),
  [CombatActionName.UseGreenAutoinjector]: null,
  [CombatActionName.UseBlueAutoinjector]: null,
  [CombatActionName.PassTurn]: null,
  [CombatActionName.ConditionPassTurn]: null,
  [CombatActionName.Blind]: (className: string) => SVG_ICONS[IconName.EyeClosed](className),
  [CombatActionName.PayActionPoint]: null,
};
