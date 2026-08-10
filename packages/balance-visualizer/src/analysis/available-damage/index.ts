import {
  CombatantClass,
  Equipment,
  IdGeneratorSequential,
  invariant,
  iterateNumericEnumKeyedRecord,
  RealResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { DamagePerTurnCalculator } from "../../metrics/damage-per-turn";
import { ExpectedDamageCalculator } from "../../metrics/expected-damage";
import { TargetDummy } from "../../metrics/target-dummy";
import { getFrozenMonsterEvasion } from "../../dummies/frozen-monster-evasion";
import { RunAggregator } from "../../sim/run-aggregator";
import { RoomVisit } from "../../sim/run-history";
import { Distribution, distributionOf } from "../../utils/distribution";
import { ArchetypeParty, DrawnMember } from "./party-draw";
import { CharacterArchetype, DEFAULT_ARCHETYPE_PROFILES } from "../character-archetype";
import { DamageSources, EquipmentDamageSources } from "../equipment-damage-sources";
import { EquipmentPoolBySlot } from "../equipment-pool-by-slot";
import { MonsterAttributeIntensity } from "../monster-attributes/monster-attribute-intensity";
import { withoutRequirements } from "../unrestricted-equipment";
import { GearBudget } from "./gear-budget";
import { OffensiveAvailability } from "./offensive-availability";
import { SpecialtyAllocation } from "./specialty-allocation";
import { SpecialtyDamageSolver } from "./specialty-damage-solver";
import { Holdables, SpecialtyHoldables } from "./specialty-holdables";

/** The share of the offensive attributes available to them that a character commits to hitting
 * harder with a basic attack. One of several intensities in the study and not interchangeable with
 * the others — MonsterAttributeIntensity says how dangerous the monsters are, and a character who
 * spends heavily on attack damage is by that fact spending less on staying alive.
 *
 * Shared by the worker and the CLI so a table read in the browser and one printed from the terminal
 * are the same measurement. */
export const DEFAULT_ATTACK_DAMAGE_INTENSITY = 0.5;

const PARTY_SIZE = 3;
const DAMAGE_ROLL_SAMPLES = 8;
/** The middle-of-the-road monster the study measures against. */
const TARGET_INTENSITY = MonsterAttributeIntensity.Medium;
/** No armor, no crit chance reduction (Agility), no crit damage reduction (Vitality), no shield. */
const UNMITIGATING_TARGET = { armorClass: 0, agility: 0, vitality: 0 };

export interface WeaponDamageRange {
  min: number;
  max: number;
}

/** What each hand was holding, kept per weapon rather than summed. The two are not interchangeable —
 * an off-hand swing lands at OFF_HAND_DAMAGE_MODIFIER and OFF_HAND_ACCURACY_MODIFIER — so adding
 * them would read as a two-hander's range and overstate a dual wielder. Those modifiers are not
 * applied here at all: this describes what dropped, and damagePerTurn is where what it does shows
 * up, through the real off-hand action against the dummy. */
export interface HeldWeaponDamage {
  mainHand: null | WeaponDamageRange;
  /** Null where the specialty never held a second weapon: a shield or a free off hand. Averaged only
   * over the runs that did, so an early room with one sword does not read as a weak off hand. */
  offHand: null | WeaponDamageRange;
}

export interface SpecialtyRoomDamage {
  /** Absent until a run drew this specialty and found it a weapon. */
  damagePerTurn: null | Distribution;
  /** Mean points bought with each budget, over the runs that produced a damage figure. */
  meanAllocation: null | SpecialtyAllocation;
  meanWeaponDamage: null | HeldWeaponDamage;
  /** Runs in which this specialty was drawn into the party at all. The denominator for the rest. */
  drawnCount: number;
  /** Runs where the specialty was drawn but its weapon type had not dropped. Excluded from the
   * damage figures rather than scored as unarmed, so the damage column answers "what does this
   * specialty do when it is working" and this column answers "how often is it not". */
  unavailableCount: number;
  percentRunsUnavailable: number;
}

export interface RoomAvailableDamage {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
  /** What one character could be wearing, per channel, before any of it is spent. */
  availability: DamageSources;
  bySpecialty: Partial<Record<CharacterArchetype, SpecialtyRoomDamage>>;
}

class SpecialtySamples {
  readonly damagePerTurn: number[] = [];
  readonly allocations: SpecialtyAllocation[] = [];
  readonly weaponDamage: HeldWeaponDamage[] = [];
  drawnCount = 0;
  unavailableCount = 0;
}

class RoomSamples {
  readonly availability: DamageSources[] = [];
  readonly bySpecialty = new Map<CharacterArchetype, SpecialtySamples>();

  forSpecialty(archetype: CharacterArchetype) {
    const samples = this.bySpecialty.get(archetype) ?? new SpecialtySamples();
    this.bySpecialty.set(archetype, samples);
    return samples;
  }
}

/** Damage per turn each specialty could reach, room by room, without solving for anyone's loadout.
 *
 * The loot that has dropped is reduced to two numbers per character — a budget of offensive
 * attributes and a cap on each channel of it (see GearBudget) — plus the best weapon of the
 * specialty's own type. Contention between party members is handled by the division that produces
 * those numbers rather than by assigning items to people, so a specialty's figure does not depend on
 * who it was drawn alongside, and there is no assignment problem to approximate.
 *
 * The party is still re-drawn every run, because the character is: which class fills a specialty and
 * what level they are at a given room both come off the walk. */
export class AvailableDamageBySpecialty implements RunAggregator<RoomAvailableDamage[]> {
  private readonly idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private readonly solver: SpecialtyDamageSolver;
  private samplesByRoom: RoomSamples[] = [];
  private roomIdentities: Pick<
    RoomAvailableDamage,
    "ordinal" | "floorNumber" | "roomNumberOnFloor"
  >[] = [];
  private drawn: DrawnMember[] = [];

  constructor(
    private readonly roll: () => number,
    private readonly attackDamageIntensity: number
  ) {
    this.solver = new SpecialtyDamageSolver(
      new DamagePerTurnCalculator(
        new ExpectedDamageCalculator(
          new RealResourceChangePropertiesStrategy(),
          DAMAGE_ROLL_SAMPLES
        )
      ),
      this.idGenerator
    );
  }

  nextPartyClasses(): CombatantClass[] {
    this.drawn = ArchetypeParty.draw(PARTY_SIZE, DEFAULT_ARCHETYPE_PROFILES, this.roll);
    return this.drawn.map(({ combatantClass }) => combatantClass);
  }

  collectRun(visits: RoomVisit[]) {
    if (this.samplesByRoom.length === 0) {
      this.roomIdentities = visits.map(({ ordinal, floorNumber, roomNumberOnFloor }) => ({
        ordinal,
        floorNumber,
        roomNumberOnFloor,
      }));
      this.samplesByRoom = visits.map(() => new RoomSamples());
    }

    invariant(
      visits.length === this.samplesByRoom.length,
      "runs visited different room counts, so they do not line up room by room"
    );

    const pool = new EquipmentPoolBySlot();
    const dropped: Equipment[] = [];

    for (const [index, visit] of visits.entries()) {
      for (const equipment of visit.equipmentDropped) {
        const unrestricted = withoutRequirements(equipment);
        pool.add(unrestricted);
        dropped.push(unrestricted);
      }

      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a visited room has no sample collector");

      const availability = pool.perCharacterAverageOffensiveAttributes(PARTY_SIZE);
      samples.availability.push(availability);

      this.collectRoom(visit, dropped, availability, samples);
    }
  }

  private collectRoom(
    visit: RoomVisit,
    dropped: Equipment[],
    availability: DamageSources,
    samples: RoomSamples
  ) {
    const target = TargetDummy.build(
      {
        ...UNMITIGATING_TARGET,
        evasion: getFrozenMonsterEvasion(visit.floorNumber, TARGET_INTENSITY),
      },
      this.idGenerator
    );

    this.drawn.forEach(({ archetype, profile }, member) => {
      const specialty = samples.forSpecialty(archetype);
      specialty.drawnCount += 1;

      const picked = SpecialtyHoldables.bestFor(profile.holdableConfiguration, dropped);
      if (picked === null) {
        specialty.unavailableCount += 1;
        return;
      }

      const { holdables, movedToBudget } = SpecialtyHoldables.withAffixesMovedToBudget(picked);
      const character = visit.characters[member];
      invariant(character !== undefined, "the walk produced fewer characters than were drawn");

      const budget = GearBudget.from(
        EquipmentDamageSources.sum([availability, movedToBudget]),
        this.attackDamageIntensity
      );

      const solved = this.solver.solve(
        character.combatant,
        target,
        holdables,
        budget,
        profile,
        this.attackDamageIntensity
      );

      specialty.damagePerTurn.push(solved.damagePerTurn);
      specialty.allocations.push(solved.allocation);
      specialty.weaponDamage.push(AvailableDamageBySpecialty.heldWeaponDamage(holdables));
    });
  }

  assemble(): RoomAvailableDamage[] {
    return this.roomIdentities.map((identity, index) => {
      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a room has no samples despite every run visiting it");

      const bySpecialty: Partial<Record<CharacterArchetype, SpecialtyRoomDamage>> = {};
      for (const [archetype, specialty] of samples.bySpecialty) {
        bySpecialty[archetype] = AvailableDamageBySpecialty.describe(specialty);
      }

      return {
        ...identity,
        availability: EquipmentDamageSources.scale(
          EquipmentDamageSources.sum(samples.availability),
          1 / samples.availability.length
        ),
        bySpecialty,
      };
    });
  }

  private static describe(specialty: SpecialtySamples): SpecialtyRoomDamage {
    const scored = specialty.damagePerTurn.length;

    return {
      damagePerTurn: scored === 0 ? null : distributionOf(specialty.damagePerTurn),
      meanAllocation:
        scored === 0 ? null : AvailableDamageBySpecialty.meanAllocation(specialty.allocations),
      meanWeaponDamage:
        scored === 0 ? null : AvailableDamageBySpecialty.meanWeaponDamage(specialty.weaponDamage),
      drawnCount: specialty.drawnCount,
      unavailableCount: specialty.unavailableCount,
      percentRunsUnavailable:
        specialty.drawnCount === 0 ? 0 : (specialty.unavailableCount / specialty.drawnCount) * 100,
    };
  }

  private static meanAllocation(allocations: SpecialtyAllocation[]): SpecialtyAllocation {
    const fromGear = EquipmentDamageSources.scale(
      EquipmentDamageSources.sum(allocations.map((allocation) => allocation.fromGear)),
      1 / allocations.length
    );

    const fromDiscretionaryPoints: SpecialtyAllocation["fromDiscretionaryPoints"] = {};
    for (const allocation of allocations) {
      for (const [attribute, value] of iterateNumericEnumKeyedRecord(
        allocation.fromDiscretionaryPoints
      )) {
        fromDiscretionaryPoints[attribute] =
          (fromDiscretionaryPoints[attribute] ?? 0) + value / allocations.length;
      }
    }

    return { fromGear, fromDiscretionaryPoints };
  }

  /** The affixes were baked into the base range before being stripped, so these are already the
   * modified ranges. A shield yields null the same way an empty hand does — it is not a weapon, so
   * getWeaponProperties refuses it. */
  private static heldWeaponDamage(holdables: Holdables): HeldWeaponDamage {
    return {
      mainHand: AvailableDamageBySpecialty.damageRangeOf(holdables.mainHand),
      offHand: AvailableDamageBySpecialty.damageRangeOf(holdables.offHand),
    };
  }

  private static damageRangeOf(equipment: null | Equipment): null | WeaponDamageRange {
    if (equipment === null) {
      return null;
    }
    const weaponProperties = equipment.getWeaponProperties();
    if (weaponProperties instanceof Error) {
      return null;
    }
    const { min, max } = weaponProperties.damage;
    return { min, max };
  }

  private static meanWeaponDamage(samples: HeldWeaponDamage[]): HeldWeaponDamage {
    const meanOfHand = (hand: keyof HeldWeaponDamage): null | WeaponDamageRange => {
      const held = samples.map((sample) => sample[hand]).filter((range) => range !== null);

      if (held.length === 0) {
        return null;
      }
      return {
        min: AvailableDamageBySpecialty.mean(held.map(({ min }) => min)),
        max: AvailableDamageBySpecialty.mean(held.map(({ max }) => max)),
      };
    };

    return { mainHand: meanOfHand("mainHand"), offHand: meanOfHand("offHand") };
  }

  private static mean(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
