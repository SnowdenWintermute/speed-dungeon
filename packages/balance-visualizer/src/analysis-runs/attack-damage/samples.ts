import {
  CombatantClass,
  EquipmentBaseItem,
  EquipmentSlotId,
  HoldableSlotId,
} from "@speed-dungeon/common";
import { CombatantAttackContributingAttributes } from "../analysis-run-reporter";
import { CharacterWeaponSpecialty } from "@/analysis-subjects/analysis-character-specification";
import { TalliedBaseItem } from "@/analysis-subjects/equipment-base-item-tally";

/** NumberRange is a class, and a worker's postMessage would hand back its fields without it */
export interface DamageRange {
  min: number;
  max: number;
}

export interface SampleTooltipDamage {
  [EquipmentSlotId.MainHand]: DamageRange;
  [EquipmentSlotId.OffHand]: DamageRange | null;
}

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
  tooltipDamage: SampleTooltipDamage;
  wornHoldables: Record<HoldableSlotId, EquipmentBaseItem | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
}

/**
 * What dropped is a fact about the party, not about any one character, so availability is recorded
 * once per room rather than copied onto each character's sample.
 */
export interface RoomAvailability {
  runIndex: number;
  floor: number;
  room: number;
  /** every base item dropped since the run began, not only this room's drops */
  availableEquipment: TalliedBaseItem[];
}

export interface AttackDamageRunSetResult {
  samples: AttackDamageSample[];
  availability: RoomAvailability[];
  /** runs that threw and contributed nothing, so a short set is visible rather than silent */
  runsFailed: number;
}
