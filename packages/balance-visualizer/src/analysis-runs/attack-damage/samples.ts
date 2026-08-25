import { CombatantClass, EquipmentBaseItem, EquipmentSlotId } from "@speed-dungeon/common";
import {
  CombatantAttackContributingAttributes,
  CombatantReportTooltipDamage,
} from "../analysis-run-reporter";
import { CharacterWeaponSpecialty } from "@/analysis-subjects/analysis-character-specification";
import { EquipmentBaseItemTally } from "@/analysis-subjects/equipment-base-item-tally";

/**
 * One denormalized row per run, room and character. Dimensions travel with the row so a table can
 * slice on any subset of them without the collection stage having chosen a key.
 */
export interface AttackDamageSample {
  runIndex: number;
  floor: number;
  room: number;
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass | null;
  mainClassLevel: number;
  supportClassLevel: number | null;
  sampledDamageOnDummy: number;
  tooltipDamage: CombatantReportTooltipDamage;
  wornHoldables: {
    [EquipmentSlotId.MainHand]: EquipmentBaseItem | null;
    [EquipmentSlotId.OffHand]: EquipmentBaseItem | null;
  };
  contributingAllocations: CombatantAttackContributingAttributes;
  /** party wide, so shared by reference with the other characters sampled in this room */
  availableEquipment: EquipmentBaseItemTally;
}
