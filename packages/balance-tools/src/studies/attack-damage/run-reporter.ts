import {
  AdventuringParty,
  COMBAT_ACTIONS,
  Combatant,
  CombatantProperties,
  CombatAttribute,
  DEX_TO_ACCURACY_RATIO,
  Equipment,
  EquipmentSlotId,
  getAttackActionName,
  getTooltipOffensiveSpec,
  HoldableSlotId,
  invariant,
  NumberRange,
  WeaponProperties,
} from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "@/analysis-runs/analysis-run-reporter";
import { numericEnumKeyedRecord } from "@/utils/numeric-enum-record";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./goal-performance-checker";

export enum AttackDamageContributingAttribute {
  Strength,
  Dexterity,
  Accuracy,
  FlatDamage,
}

// not a Record over HoldableSlotId like the equipment below it: a combatant always has a main hand
// attack to quote, even bare handed, and only the off hand one is conditional
export interface CombatantReportTooltipDamage {
  [EquipmentSlotId.MainHand]: NumberRange;
  [EquipmentSlotId.OffHand]: NumberRange | null;
}

type ContributionsByAttribute = Record<AttackDamageContributingAttribute, number>;

export type CombatantAttackContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number }
>;

export interface AttackDamageCombatantReport extends AnalysisCombatantReport {
  sampledDamageOnDummy: number;
  /** over the same sampled attacks the damage came from, off hand swings excluded */
  mainHandSwingCount: number;
  mainHandLandedHitCount: number;
  mainHandCriticalHitCount: number;
  tooltipDamage: CombatantReportTooltipDamage;
  heldEquipment: Record<HoldableSlotId, Equipment | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
}

export class AttackDamageRunReporter extends RoomReportingRunReporter<AttackDamageCombatantReport> {
  constructor(
    party: AdventuringParty,
    private goalPerformanceChecker: SampledDamageOnTargetDummyGoalPerformanceChecker
  ) {
    super(party);
  }

  private tooltipRangeForHand(
    combatant: Combatant,
    weaponPropertiesOption: WeaponProperties | undefined,
    options: { isOffHand: boolean }
  ) {
    const attackActionName = getAttackActionName(weaponPropertiesOption, options);
    const tooltip = getTooltipOffensiveSpec(COMBAT_ACTIONS[attackActionName], combatant);
    invariant(tooltip?.hpChangeRange !== undefined);
    return tooltip.hpChangeRange;
  }

  private getTooltipDamage(combatant: Combatant): CombatantReportTooltipDamage {
    const weaponsHeld = combatant.getWeaponsInSlots(
      [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand],
      { usableWeaponsOnly: false }
    );
    const mainHandOption = weaponsHeld[EquipmentSlotId.MainHand];
    const offHandEquipmentOption = combatant
      .getCombatantProperties()
      .equipment.getEquipmentInSlot(EquipmentSlotId.OffHand);
    const hasOffHandAttack =
      !mainHandOption?.equipment.isTwoHanded() && !offHandEquipmentOption?.isShield();

    return {
      [EquipmentSlotId.MainHand]: this.tooltipRangeForHand(
        combatant,
        mainHandOption?.weaponProperties,
        { isOffHand: false }
      ),
      [EquipmentSlotId.OffHand]: hasOffHandAttack
        ? this.tooltipRangeForHand(
            combatant,
            weaponsHeld[EquipmentSlotId.OffHand]?.weaponProperties,
            { isOffHand: true }
          )
        : null,
    };
  }

  private getHeldEquipment(combatantProperties: CombatantProperties) {
    const equipmentProperties = combatantProperties.equipment;
    return {
      [EquipmentSlotId.MainHand]: equipmentProperties.getEquipmentInSlot(EquipmentSlotId.MainHand),
      [EquipmentSlotId.OffHand]: equipmentProperties.getEquipmentInSlot(EquipmentSlotId.OffHand),
    };
  }

  /**
   * Read through `Equipment.getAttributesOnEquipmentList`, which is what the combatant's own total
   * reads through, so the two agree. Summing affix values per item instead would not: the analysis
   * driver swaps that static for one scaling every attribute by the allocation intensity, so at
   * anything under 100% a per-item read reports gear the character never actually received. It also
   * skips broken items and counts non-affix attributes, both of which the combatant does too.
   */
  private getGearContributions(combatantProperties: CombatantProperties): ContributionsByAttribute {
    const result = numericEnumKeyedRecord(AttackDamageContributingAttribute, () => 0);
    const equippedItems = [
      ...combatantProperties.equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: false }),
    ];
    const fromEquipment = Equipment.getAttributesOnEquipmentList(equippedItems);

    result[AttackDamageContributingAttribute.Strength] = fromEquipment[CombatAttribute.Strength];
    result[AttackDamageContributingAttribute.Dexterity] = fromEquipment[CombatAttribute.Dexterity];
    result[AttackDamageContributingAttribute.Accuracy] =
      fromEquipment[CombatAttribute.Accuracy] +
      fromEquipment[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO;

    // flat damage is not an attribute, so it is not in that record. weapon flat damage is already
    // inside the weapon's damage range, so only rings and amulets with +damage are counted here
    for (const equipment of equippedItems) {
      if (!equipment.isWeapon()) {
        result[AttackDamageContributingAttribute.FlatDamage] += equipment.getFlatDamageBonus();
      }
    }

    return result;
  }

  private contributionsFromAttributes(
    attributes: Record<CombatAttribute, number>
  ): ContributionsByAttribute {
    return {
      [AttackDamageContributingAttribute.Strength]: attributes[CombatAttribute.Strength],
      [AttackDamageContributingAttribute.Dexterity]: attributes[CombatAttribute.Dexterity],
      // you can't allocate to accuracy, but reading it the same way as inherent keeps the two
      // sources comparable
      [AttackDamageContributingAttribute.Accuracy]:
        attributes[CombatAttribute.Accuracy] +
        attributes[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO,
      [AttackDamageContributingAttribute.FlatDamage]: 0,
    };
  }

  private getContributingAttributes(
    combatantProperties: CombatantProperties
  ): CombatantAttackContributingAttributes {
    const { attributeProperties } = combatantProperties;
    const fromGear = this.getGearContributions(combatantProperties);
    const allocated = this.contributionsFromAttributes(
      attributeProperties.getAllocatedAttributes()
    );
    const inherent = this.contributionsFromAttributes(attributeProperties.getInherentAttributes());

    return numericEnumKeyedRecord(AttackDamageContributingAttribute, (attribute) => ({
      fromGear: fromGear[attribute],
      allocated: allocated[attribute],
      inherent: inherent[attribute],
    }));
  }

  protected getCombatantReport(
    combatant: Combatant,
    sampledDamageOnDummy: number
  ): AttackDamageCombatantReport {
    const combatantProperties = combatant.getCombatantProperties();

    // the combatant has not changed since the solvers last scored it, so this re-reads the same
    // attacks sampledDamageOnDummy was averaged from rather than rolling new ones
    const { mainHandSwingCount, mainHandLandedHitCount, mainHandCriticalHitCount } =
      this.goalPerformanceChecker.sampleAttacksOnTargetDummy(
        combatant,
        this.party.dungeonExplorationManager.getCurrentFloor()
      );

    return {
      ...this.commonCombatantFields(combatant),
      sampledDamageOnDummy,
      mainHandSwingCount,
      mainHandLandedHitCount,
      mainHandCriticalHitCount,
      tooltipDamage: this.getTooltipDamage(combatant),
      heldEquipment: this.getHeldEquipment(combatantProperties),
      contributingAttributes: this.getContributingAttributes(combatantProperties),
    };
  }
}
