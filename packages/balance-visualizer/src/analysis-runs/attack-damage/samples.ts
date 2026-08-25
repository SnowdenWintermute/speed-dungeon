import {
  CombatantClass,
  EquipmentBaseItem,
  EquipmentSlotId,
  HoldableSlotId,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { CombatantAttackContributingAttributes } from "../analysis-run-reporter";
import { CharacterWeaponSpecialty } from "@/analysis-subjects/analysis-character-specification";
import { TalliedBaseItem } from "@/analysis-subjects/equipment-base-item-tally";

// serialized rather than the NumberRange itself: postMessage copies own properties without the
// prototype, so a class arrives on the other side with its fields and none of its methods
export interface SampleTooltipDamage {
  [EquipmentSlotId.MainHand]: SerializedOf<NumberRange>;
  [EquipmentSlotId.OffHand]: SerializedOf<NumberRange> | null;
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
