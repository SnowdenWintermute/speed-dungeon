import { AbilityTreeAbility, CombatActionName, CombatantProperties } from "@speed-dungeon/common";
import { ReactNode } from "react";

export function getAbilityIcon(
  ability: AbilityTreeAbility,
  combatantProperties: CombatantProperties
): ReactNode {
  return <div>icon</div>;
  // switch (abilityName) {
  //   case AbilityName.Attack:
  //   case AbilityName.AttackMeleeMainhand:
  //   case AbilityName.AttackMeleeOffhand:
  //   case AbilityName.AttackRangedMainhand:
  //     const mhOption = CombatantEquipment.getEquippedHoldable(
  //       combatantProperties,
  //       HoldableSlotType.MainHand
  //     );
  //     if (
  //       mhOption &&
  //       mhOption.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon
  //     ) {
  //       return <RangedIcon className="h-[20px] fill-slate-400 stroke-slate-400" />;
  //     } else {
  //       return <SwordSlashIcon className="h-[20px] fill-slate-400" />;
  //     }
  //   case AbilityName.Fire:
  //     return <FireIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Ice:
  //     return <IceIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Healing:
  //     return <HealthCrossIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Destruction:
  //     return <FireIcon className="h-[20px] fill-slate-400" />;
  // }
}
