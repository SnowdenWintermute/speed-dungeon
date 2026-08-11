import {
  CombatAttribute,
  CombatantAttributeRecord,
  Equipment,
  IdGeneratorSequential,
  invariant,
  RealResourceChangePropertiesStrategy,
  NormalizedPercentage,
} from "@speed-dungeon/common";
import { DamagePerTurnCalculator } from "../../metrics/damage-per-turn";
import { ExpectedDamageCalculator } from "../../metrics/expected-damage";
import { TargetDummy, TargetDummyStats } from "../../metrics/target-dummy";
import { getFrozenMonsterEvasion } from "../../dummies/frozen-monster-evasion";
import { CharacterSpec } from "../../sim/character-spec";
import { RunAggregator } from "../../sim/run-aggregator";
import { RoomVisit } from "../../sim/run-history";
import { DAMAGE_CHANNELS, EquipmentDamageSources } from "../equipment-damage-sources";
import { EquipmentPoolBySlot } from "../equipment-pool-by-slot";
import { MonsterAttributeIntensity } from "../monster-attributes/monster-attribute-intensity";
import { withoutRequirements } from "../unrestricted-equipment";
import {
  ComboRoomDamage,
  ComboSampleAnalysis,
  ComboSampleData,
  ComboSamples,
} from "./combo-samples";
import { GearBudget } from "./gear-budget";
import { ArchetypeParty, DrawnMember, PartyDrawSettings } from "./party-draw";
import { comboKey, SpecialtyCombo, SpecialtyComboKey, specOf } from "./specialty-combo";
import { SolvedSpecialtyDamage, SpecialtyDamageSolver } from "./specialty-damage-solver";
import { SpecialtyHoldables } from "./specialty-holdables";

/* percent of available offensive attributes a character will allocate to */
export const DEFAULT_ATTACK_DAMAGE_INTENSITY: NormalizedPercentage = 0.5;

const PARTY_SIZE = 3;
const DAMAGE_ROLL_SAMPLES = 8;
const TARGET_DUMMY_DEFENSIVE_INTENSITY = MonsterAttributeIntensity.Medium;
const UNMITIGATING_TARGET: TargetDummyStats = {
  armorClass: 0,
  agility: 0,
  vitality: 0,
  evasion: 0,
};

interface RoomIdentity {
  ordinal: number;
  floor: number;
  roomNumberOnFloor: number;
}

/** Returned from workers and merged */
export interface RoomComboSamples extends RoomIdentity {
  byCombo: Partial<Record<SpecialtyComboKey, ComboSampleData>>;
  // if no run had equipment drop in this room it won't be shown in the table
  runsWithEquipmentDropped: number;
}

export interface RoomAvailableDamage extends RoomIdentity {
  byCombo: Partial<Record<SpecialtyComboKey, ComboRoomDamage>>;
  runsWithEquipmentDropped: number;
}

export class AvailableDamageResults {
  /** Rooms line up across workers because every walk visits the same room count in the same order. */
  static merge(parts: RoomComboSamples[][]): RoomComboSamples[] {
    const walked = parts.filter((rooms) => rooms.length > 0);
    const first = walked[0];
    if (first === undefined) {
      return [];
    }

    return first.map((identity, index) => {
      const byCombo: Partial<Record<SpecialtyComboKey, ComboSampleData>> = {};

      for (const key of new Set(
        walked.flatMap((rooms) => Object.keys(rooms[index]?.byCombo ?? {}))
      )) {
        const comboKey = key as SpecialtyComboKey;
        const forCombo = walked
          .map((rooms) => rooms[index]?.byCombo[comboKey])
          .filter((samples) => samples !== undefined);
        byCombo[comboKey] = ComboSampleAnalysis.merge(forCombo);
      }

      return {
        ordinal: identity.ordinal,
        floor: identity.floor,
        roomNumberOnFloor: identity.roomNumberOnFloor,
        byCombo,
        runsWithEquipmentDropped: walked.reduce(
          (sum, rooms) => sum + (rooms[index]?.runsWithEquipmentDropped ?? 0),
          0
        ),
      };
    });
  }

  /** for filtering out non-drop rooms from the display */
  static withLootDropped(rooms: RoomAvailableDamage[]) {
    return rooms.filter((room) => room.runsWithEquipmentDropped > 0);
  }

  static describe(rooms: RoomComboSamples[]): RoomAvailableDamage[] {
    return rooms.map((room) => {
      const byCombo: Partial<Record<SpecialtyComboKey, ComboRoomDamage>> = {};
      for (const [key, samples] of Object.entries(room.byCombo)) {
        if (samples !== undefined) {
          byCombo[key as SpecialtyComboKey] = ComboSampleAnalysis.describe(samples);
        }
      }
      return { ...room, byCombo };
    });
  }
}

export interface AvailableDamageSettings {
  attackDamageIntensity: number;
  draw: PartyDrawSettings;
  /** Which part of the combo cycle this instance starts on. One per worker when work is split. */
  comboCycleOffset?: number;
}

class RoomSamples {
  readonly byCombo = new Map<SpecialtyComboKey, ComboSamples>();
  runsWithEquipmentDropped = 0;

  forCombo(combo: SpecialtyCombo) {
    const key = comboKey(combo);
    const samples = this.byCombo.get(key) ?? new ComboSamples();
    this.byCombo.set(key, samples);
    return samples;
  }
}

/** Damage per turn each specialty/class/support combo could reach, room by room, without solving for
 * anyone's loadout. The loot that has dropped is reduced to a budget of offensive attributes and a
 * cap on each channel of it (see GearBudget) plus the best weapon of the combo's own type, so
 * contention is handled by the division producing those numbers rather than by assigning items to
 * people. */
export class AvailableDamageBySpecialty implements RunAggregator<RoomComboSamples[]> {
  private readonly idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private readonly solver: SpecialtyDamageSolver;
  private readonly party: ArchetypeParty;
  private samplesByRoom: RoomSamples[] = [];
  private roomIdentities: RoomIdentity[] = [];
  private drawn: DrawnMember[] = [];
  /** Cache to avoid re-solving if solver inputs haven't changed */
  private lastSolvePerMember = new Map<
    number,
    { signature: string; solved: SolvedSpecialtyDamage }
  >();
  /** What each seat has already spent on level-ups. Points stay spent for the rest of the run, so a
   * later room only ever decides the points earned since the last one. Reset per run with the seats. */
  private committedPointsPerMember = new Map<number, CombatantAttributeRecord>();

  constructor(
    roll: () => number,
    private readonly settings: AvailableDamageSettings
  ) {
    this.party = new ArchetypeParty(roll, settings.comboCycleOffset ?? 0);
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

  nextParty(): CharacterSpec[] {
    this.drawn = this.party.draw(PARTY_SIZE, this.settings.draw);
    return this.drawn.map(({ combo }) => specOf(combo));
  }

  collectRun(visits: RoomVisit[]) {
    if (this.samplesByRoom.length === 0) {
      this.roomIdentities = visits.map(({ ordinal, floor, roomNumberOnFloor }) => ({
        ordinal,
        floor,
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
    this.lastSolvePerMember = new Map();
    this.committedPointsPerMember = new Map();

    // the party walks in holding things — a mage's rotting branch is the only two-handed weapon in
    // the dungeon until one drops, and a warrior brings the first shield. Counting only monster loot
    // read those specialties as having no weapon at all through the early floors
    for (const equipment of AvailableDamageBySpecialty.startingEquipmentOf(visits)) {
      const unrestricted = withoutRequirements(equipment);
      pool.add(unrestricted);
      dropped.push(unrestricted);
    }

    for (const [index, visit] of visits.entries()) {
      for (const equipment of visit.equipmentDropped) {
        const unrestricted = withoutRequirements(equipment);
        pool.add(unrestricted);
        dropped.push(unrestricted);
      }

      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a visited room has no sample collector");

      if (visit.equipmentDropped.length > 0) {
        samples.runsWithEquipmentDropped += 1;
      }

      this.collectRoom(visit, dropped, pool, samples);
    }
  }

  /** Read from the first room, before anything has dropped. Nothing in the walk ever re-equips a
   * character, so what they hold there is what they started with. */
  private static startingEquipmentOf(visits: RoomVisit[]): Equipment[] {
    const firstRoom = visits[0];
    if (firstRoom === undefined) {
      return [];
    }

    return firstRoom.characters.flatMap(({ combatant }) =>
      combatant.combatantProperties.equipment
        .getAllEquippedItems({ includeUnselectedHotswapSlots: false })
        .filter((item) => item instanceof Equipment)
    );
  }

  private collectRoom(
    visit: RoomVisit,
    dropped: Equipment[],
    pool: EquipmentPoolBySlot,
    samples: RoomSamples
  ) {
    const target = TargetDummy.build(
      {
        ...UNMITIGATING_TARGET,
        evasion: getFrozenMonsterEvasion(visit.floor, TARGET_DUMMY_DEFENSIVE_INTENSITY),
      },
      this.idGenerator
    );
    const wearableAvailability = pool.perCharacterAverageOffensiveAttributes(PARTY_SIZE);

    this.drawn.forEach(({ combo, profile }, member) => {
      const comboSamples = samples.forCombo(combo);
      comboSamples.recordDrawn();

      const picked = SpecialtyHoldables.bestFor(profile.holdableConfiguration, dropped);
      if (picked === null) {
        comboSamples.recordUnavailable();
        return;
      }

      const character = visit.characters[member];
      invariant(character !== undefined, "the walk produced fewer characters than were drawn");

      const { holdables, movedToBudget } = SpecialtyHoldables.withAffixesMovedToBudget(picked);
      const availability = EquipmentDamageSources.sum([wearableAvailability, movedToBudget]);
      const { attributeProperties, classProgressionProperties } =
        character.combatant.combatantProperties;
      const discretionaryPointsAvailable = attributeProperties.getUnspentPoints();

      // the weapons are identified before stripping, which copies them: picked holds references into
      // the drop pool, so the same weapon in a later room is the same object
      const signature = [
        picked.mainHand?.getEntityId() ?? "none",
        picked.offHand?.getEntityId() ?? "none",
        classProgressionProperties.getMainClass().level,
        classProgressionProperties.getSupportClassOption()?.level ?? 0,
        discretionaryPointsAvailable,
        ...DAMAGE_CHANNELS.map((channel) => availability[channel]),
      ].join("|");

      const cached = this.lastSolvePerMember.get(member);
      const solved =
        cached?.signature === signature
          ? cached.solved
          : this.solver.solve(
              character.combatant,
              target,
              holdables,
              GearBudget.from(availability, this.settings.attackDamageIntensity),
              profile,
              this.settings.attackDamageIntensity,
              this.committedPointsPerMember.get(member) ?? {}
            );
      this.lastSolvePerMember.set(member, { signature, solved });
      this.committedPointsPerMember.set(member, solved.allocation.fromDiscretionaryPoints);

      comboSamples.recordScored({
        damagePerTurn: solved.damagePerTurn,
        allocation: solved.allocation,
        availability,
        discretionaryPointsAvailable,
        // the walk never equips loot or spends a point, so its totals are what class, level and
        // support class give for free
        inherentStrength: character.totalAttributes[CombatAttribute.Strength] ?? 0,
        inherentDexterity: character.totalAttributes[CombatAttribute.Dexterity] ?? 0,
        holdables,
        weaponCandidates: SpecialtyHoldables.weaponCandidates(
          profile.holdableConfiguration,
          dropped
        ),
      });
    });
  }

  assemble(): RoomComboSamples[] {
    return this.roomIdentities.map((identity, index) => {
      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a room has no samples despite every run visiting it");

      const byCombo: Partial<Record<SpecialtyComboKey, ComboSampleData>> = {};
      for (const [key, combo] of samples.byCombo) {
        byCombo[key] = combo.getData();
      }

      return {
        ...identity,
        byCombo,
        runsWithEquipmentDropped: samples.runsWithEquipmentDropped,
      };
    });
  }
}
