import {
  CombatAttribute,
  Combatant,
  CombatantAttributeRecord,
  EquipmentSlotType,
  HoldableSlotType,
  IdGenerator,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { DamagePerTurnCalculator } from "../../metrics/damage-per-turn";
import { ArchetypeProfile } from "../character-archetype";
import { DAMAGE_CHANNELS } from "../equipment-damage-sources";
import { GearBudget, POINTS_PER_BUDGET_UNIT } from "./gear-budget";
import { FlatDamageCarrier } from "./flat-damage-carrier";
import {
  copyAllocation,
  DAMAGE_CHANNEL_ATTRIBUTES,
  DamageChannel,
  DISCRETIONARY_DAMAGE_ATTRIBUTES,
  emptyAllocation,
  SpecialtyAllocation,
} from "./specialty-allocation";
import { Holdables } from "./specialty-holdables";

/** How much of the gear budget one move spends. Small enough that the order moves are taken in stops
 * mattering, large enough that a full solve stays a few hundred damage evaluations. */
const BUDGET_UNITS_PER_MOVE = 1;
const ONE_ATTRIBUTE_POINT = 1;

const ALL_EQUIPMENT_SLOTS: TaggedEquipmentSlot[] = [
  ...iterateNumericEnum(HoldableSlotType).map((slot) => ({
    type: EquipmentSlotType.Holdable as const,
    slot,
  })),
  ...iterateNumericEnum(WearableSlotType).map((slot) => ({
    type: EquipmentSlotType.Wearable as const,
    slot,
  })),
];

enum AllocationBudget {
  Gear,
  DiscretionaryPoints,
}

/** One move the climb can make. The two budgets buy different things — the gear budget buys damage
 * channels at the loot table's exchange rate, a discretionary point buys one point of one attribute
 * — so they are separate cases rather than one parameterised move. */
type AllocationMove =
  | { type: AllocationBudget.Gear; channel: DamageChannel }
  | { type: AllocationBudget.DiscretionaryPoints; attribute: CombatAttribute };

export interface SolvedSpecialtyDamage {
  damagePerTurn: number;
  allocation: SpecialtyAllocation;
}

/** The damage per turn one specialty reaches in one room, given what has dropped.
 *
 * There is no equipment search here. The gear a character could be wearing has already been reduced
 * to a budget of offensive attributes and a cap per channel, so all that is left is deciding how to
 * spend two budgets — a climb over a handful of moves, not a search over loadouts.
 *
 * Both budgets are offered to the climb together so the two are decided jointly. Spending the gear
 * budget first and the attribute points afterwards would fix the accuracy the points are then judged
 * against, and it is exactly at the accuracy cap that the two interact: a character who cannot buy
 * more accuracy off gear may want dexterity from levelling instead, or may not.
 *
 * The climb is greedy: it repeatedly takes whichever move buys the most damage. Every channel is
 * monotone (no amount of strength ever lowers an attack's damage), so a greedy step never goes
 * backwards and the budgets are always spent in full. What greedy can miss is a channel that only
 * pays after several moves into it, and the one place that could bite — accuracy, which stops paying
 * the moment hit chance saturates — fails in the harmless direction, since it goes flat rather than
 * starting flat. */
export class SpecialtyDamageSolver {
  constructor(
    private readonly damagePerTurn: DamagePerTurnCalculator,
    private readonly idGenerator: IdGenerator
  ) {}

  solve(
    character: Combatant,
    target: Combatant,
    holdables: Holdables,
    gearBudget: GearBudget,
    profile: ArchetypeProfile,
    attackDamageIntensity: number
  ): SolvedSpecialtyDamage {
    const clone = cloneDeep(character);
    const carrier = new FlatDamageCarrier(this.idGenerator);
    SpecialtyDamageSolver.dressIn(clone, holdables, carrier);

    const { attributeProperties } = clone.combatantProperties;
    const speccedBaseline = attributeProperties.getNaturalAttributes();
    // a player who is not dressing for damage alone is not spending every level-up point on it
    // either, so the same intensity governs both budgets
    const discretionaryPoints = Math.floor(attributeProperties.getUnspentPoints() * attackDamageIntensity);

    // a forced attribute is not a special case, only a shorter list of places a point can go
    const discretionaryAttributes =
      profile.forcedAllocationAttribute === null
        ? DISCRETIONARY_DAMAGE_ATTRIBUTES
        : [profile.forcedAllocationAttribute];

    const moves: AllocationMove[] = [
      ...DAMAGE_CHANNELS.map((channel) => ({ type: AllocationBudget.Gear as const, channel })),
      ...discretionaryAttributes.map((attribute) => ({
        type: AllocationBudget.DiscretionaryPoints as const,
        attribute,
      })),
    ];
    // every attribute the climb could ever write, so a trial always overwrites the one before it
    // rather than leaving an earlier trial's value standing
    const writtenAttributes = new Set([
      ...discretionaryAttributes,
      ...Object.values(DAMAGE_CHANNEL_ATTRIBUTES),
    ]);

    const allocation = emptyAllocation();
    const remaining = {
      [AllocationBudget.Gear]: gearBudget.size,
      [AllocationBudget.DiscretionaryPoints]: discretionaryPoints,
    };

    const score = (candidate: SpecialtyAllocation) => {
      SpecialtyDamageSolver.write(clone, carrier, speccedBaseline, writtenAttributes, candidate);
      return this.damagePerTurn.against(clone, target);
    };

    while (remaining[AllocationBudget.Gear] > 0 || remaining[AllocationBudget.DiscretionaryPoints] > 0) {
      let best: null | { move: AllocationMove; amount: number; damagePerTurn: number } = null;

      for (const move of moves) {
        const amount = Math.min(
          SpecialtyDamageSolver.stepOf(move),
          remaining[move.type],
          SpecialtyDamageSolver.headroomOf(move, allocation, gearBudget)
        );
        if (amount <= 0) {
          continue;
        }

        const trial = copyAllocation(allocation);
        SpecialtyDamageSolver.applyMove(move, trial, amount);
        const damagePerTurn = score(trial);

        if (best === null || damagePerTurn > best.damagePerTurn) {
          best = { move, amount, damagePerTurn };
        }
      }

      // every remaining budget is capped out, which in practice is the accuracy cap binding
      if (best === null) {
        break;
      }

      SpecialtyDamageSolver.applyMove(best.move, allocation, best.amount);
      remaining[best.move.type] -= best.amount;
    }

    return { damagePerTurn: score(allocation), allocation };
  }

  private static stepOf(move: AllocationMove) {
    return move.type === AllocationBudget.Gear ? BUDGET_UNITS_PER_MOVE : ONE_ATTRIBUTE_POINT;
  }

  /** In units of the move's own budget, so it can be compared against what is left of it. */
  private static headroomOf(
    move: AllocationMove,
    allocation: SpecialtyAllocation,
    gearBudget: GearBudget
  ) {
    if (move.type === AllocationBudget.DiscretionaryPoints) {
      return Infinity;
    }
    const spent = allocation.fromGear[move.channel];
    return (gearBudget.caps[move.channel] - spent) / POINTS_PER_BUDGET_UNIT[move.channel];
  }

  private static applyMove(
    move: AllocationMove,
    allocation: SpecialtyAllocation,
    amount: number
  ) {
    if (move.type === AllocationBudget.Gear) {
      allocation.fromGear[move.channel] += amount * POINTS_PER_BUDGET_UNIT[move.channel];
      return;
    }
    const alreadyAllocated = allocation.fromDiscretionaryPoints[move.attribute] ?? 0;
    allocation.fromDiscretionaryPoints[move.attribute] = alreadyAllocated + amount;
  }

  /** Gear becomes specced attributes rather than items. getNaturalAttributes is the base
   * getCombatantTotalAttributes builds on and the derived pass runs last, so dexterity bought here
   * still pays its accuracy on top, exactly as it would off an item. Flat damage is the exception
   * and has to be worn, because the game sums it off equipped non-weapons. */
  private static write(
    clone: Combatant,
    carrier: FlatDamageCarrier,
    speccedBaseline: CombatantAttributeRecord,
    writtenAttributes: Set<CombatAttribute>,
    allocation: SpecialtyAllocation
  ) {
    const added: CombatantAttributeRecord = {};
    for (const attribute of writtenAttributes) {
      added[attribute] = allocation.fromDiscretionaryPoints[attribute] ?? 0;
    }

    for (const [channel, attribute] of Object.entries(DAMAGE_CHANNEL_ATTRIBUTES)) {
      added[attribute] = (added[attribute] ?? 0) + allocation.fromGear[channel as DamageChannel];
    }

    const { attributeProperties } = clone.combatantProperties;
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(added)) {
      attributeProperties.setSpeccedAttributeValue(
        attribute,
        (speccedBaseline[attribute] ?? 0) + value
      );
    }

    carrier.setFlatDamage(allocation.fromGear.flatDamage);
  }

  private static dressIn(clone: Combatant, holdables: Holdables, carrier: FlatDamageCarrier) {
    const { combatantProperties } = clone;
    const { equipment } = combatantProperties;

    equipment.unequipSlots(ALL_EQUIPMENT_SLOTS);
    // unequipSlots hands what it removed to the inventory, which nothing here ever reads again
    combatantProperties.inventory.equipment.length = 0;

    if (holdables.mainHand !== null) {
      equipment.putEquipmentInSlot(holdables.mainHand, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      });
    }
    if (holdables.offHand !== null) {
      equipment.putEquipmentInSlot(holdables.offHand, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.OffHand,
      });
    }

    equipment.putEquipmentInSlot(carrier.getEquipment(), FlatDamageCarrier.SLOT);
  }
}
