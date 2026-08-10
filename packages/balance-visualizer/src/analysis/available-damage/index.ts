import {
  CombatAttribute,
  Equipment,
  IdGeneratorSequential,
  invariant,
  RealResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { DamagePerTurnCalculator } from "../../metrics/damage-per-turn";
import { ExpectedDamageCalculator } from "../../metrics/expected-damage";
import { TargetDummy } from "../../metrics/target-dummy";
import { getFrozenMonsterEvasion } from "../../dummies/frozen-monster-evasion";
import { CharacterSpec } from "../../sim/character-spec";
import { RunAggregator } from "../../sim/run-aggregator";
import { RoomVisit } from "../../sim/run-history";
import { DAMAGE_CHANNELS, EquipmentDamageSources } from "../equipment-damage-sources";
import { EquipmentPoolBySlot } from "../equipment-pool-by-slot";
import { MonsterAttributeIntensity } from "../monster-attributes/monster-attribute-intensity";
import { withoutRequirements } from "../unrestricted-equipment";
import { ComboRoomDamage, ComboSamples } from "./combo-samples";
import { GearBudget } from "./gear-budget";
import { ArchetypeParty, DrawnMember, PartyDrawSettings } from "./party-draw";
import { comboKey, SpecialtyCombo, SpecialtyComboKey, specOf } from "./specialty-combo";
import { SolvedSpecialtyDamage, SpecialtyDamageSolver } from "./specialty-damage-solver";
import { SpecialtyHoldables } from "./specialty-holdables";

/** The share of the offensive attributes available to them that a character commits to hitting
 * harder with a basic attack. Not interchangeable with the other intensities in the study —
 * MonsterAttributeIntensity says how dangerous the monsters are, and a character spending heavily on
 * attack damage is by that fact spending less on staying alive. */
export const DEFAULT_ATTACK_DAMAGE_INTENSITY = 0.5;

const PARTY_SIZE = 3;
const DAMAGE_ROLL_SAMPLES = 8;
/** The middle-of-the-road monster the study measures against. */
const TARGET_INTENSITY = MonsterAttributeIntensity.Medium;
/** No armor, no crit chance reduction (Agility), no crit damage reduction (Vitality), no shield. */
const UNMITIGATING_TARGET = { armorClass: 0, agility: 0, vitality: 0 };

export interface RoomAvailableDamage {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
  byCombo: Partial<Record<SpecialtyComboKey, ComboRoomDamage>>;
}

export interface AvailableDamageSettings {
  attackDamageIntensity: number;
  draw: PartyDrawSettings;
}

class RoomSamples {
  readonly byCombo = new Map<SpecialtyComboKey, ComboSamples>();

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
export class AvailableDamageBySpecialty implements RunAggregator<RoomAvailableDamage[]> {
  private readonly idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private readonly solver: SpecialtyDamageSolver;
  private readonly party: ArchetypeParty;
  private samplesByRoom: RoomSamples[] = [];
  private roomIdentities: Pick<
    RoomAvailableDamage,
    "ordinal" | "floorNumber" | "roomNumberOnFloor"
  >[] = [];
  private drawn: DrawnMember[] = [];
  /** Last solve per party seat, and what it was a solve of. Two rooms on most floors drop nothing
   * and level nobody, and a solve is a pure function of its inputs, so re-running one is pure waste
   * — and the solve is 97% of this analysis. Reset per run, since seats are re-drawn. */
  private lastSolvePerMember = new Map<number, { signature: string; solved: SolvedSpecialtyDamage }>();

  constructor(
    roll: () => number,
    private readonly settings: AvailableDamageSettings
  ) {
    this.party = new ArchetypeParty(roll);
    this.solver = new SpecialtyDamageSolver(
      new DamagePerTurnCalculator(
        new ExpectedDamageCalculator(new RealResourceChangePropertiesStrategy(), DAMAGE_ROLL_SAMPLES)
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
    this.lastSolvePerMember = new Map();

    for (const [index, visit] of visits.entries()) {
      for (const equipment of visit.equipmentDropped) {
        const unrestricted = withoutRequirements(equipment);
        pool.add(unrestricted);
        dropped.push(unrestricted);
      }

      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a visited room has no sample collector");

      this.collectRoom(visit, dropped, pool, samples);
    }
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
        evasion: getFrozenMonsterEvasion(visit.floorNumber, TARGET_INTENSITY),
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
              this.settings.attackDamageIntensity
            );
      this.lastSolvePerMember.set(member, { signature, solved });

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

  assemble(): RoomAvailableDamage[] {
    return this.roomIdentities.map((identity, index) => {
      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a room has no samples despite every run visiting it");

      const byCombo: Partial<Record<SpecialtyComboKey, ComboRoomDamage>> = {};
      for (const [key, combo] of samples.byCombo) {
        byCombo[key] = combo.describe();
      }

      return { ...identity, byCombo };
    });
  }
}
