import {
  AdventuringParty,
  Combatant,
  CombatantProperties,
  CombatAttribute,
  DEX_TO_ACCURACY_RATIO,
  Equipment,
  EquipmentSlotId,
  getTooltipOffensiveSpec,
  HoldableSlotId,
  invariant,
  NumberRange,
} from "@speed-dungeon/common";
import {
  AnalysisCombatantReport,
  RoomReportingRunReporter,
} from "../../analysis-runs/analysis-run-reporter.ts";
import { numericEnumKeyedRecord } from "../../utils/numeric-enum-record.ts";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "../../goal-performance-checkers/sampled-damage-on-target-dummy.ts";
import { AnalysisSpecContext } from "../../analysis-runs/analysis-spec-context.ts";
import { SampledAction } from "../../goal-performance-checkers/sampled-action-selection.ts";

export enum SampledDamageContributingAttribute {
  Strength,
  Dexterity,
  Spirit,
  Accuracy,
  FlatDamage,
}

/** quoted for whatever the character's goal has it using, which is not always a weapon attack */
export interface CombatantReportTooltipDamage {
  primary: NumberRange;
  additional: NumberRange[];
}

type ContributionsByAttribute = Record<SampledDamageContributingAttribute, number>;

export type CombatantAttackContributingAttributes = Record<
  SampledDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number }
>;

export interface SampledDamageCombatantReport extends AnalysisCombatantReport {
  sampledDamageOnDummy: number;
  /** over the same samples the damage came from; additional actions are excluded from every count */
  primaryUseCount: number;
  primaryLandedHitCount: number;
  primaryCriticalHitCount: number;
  tooltipDamage: CombatantReportTooltipDamage;
  heldEquipment: Record<HoldableSlotId, Equipment | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
}

export class SampledDamageRunReporter extends RoomReportingRunReporter<SampledDamageCombatantReport> {
  constructor(
    party: AdventuringParty,
    private analysisSpecContext: AnalysisSpecContext
  ) {
    super(party);
  }

  /**
   * The character's own goal, so the counts come off the instance and seed that produced the score
   * rather than a second sampler rolling its own numbers.
   */
  private requireSampler(combatant: Combatant) {
    const checker = this.analysisSpecContext.requireGoalPerformanceChecker(combatant.getEntityId());
    invariant(
      checker instanceof SampledDamageOnTargetDummyGoalPerformanceChecker,
      "the attack damage report reads swings off a sampled damage goal"
    );
    return checker;
  }

  private tooltipRangeForAction(combatant: Combatant, { action }: SampledAction) {
    const tooltip = getTooltipOffensiveSpec(action, combatant);
    invariant(
      tooltip?.hpChangeRange !== undefined,
      `${action.getStringName()} quotes no damage range`
    );
    return tooltip.hpChangeRange;
  }

  private getTooltipDamage(combatant: Combatant): CombatantReportTooltipDamage {
    const { primary, additional } = this.requireSampler(combatant).getSampledActions(combatant);

    return {
      primary: this.tooltipRangeForAction(combatant, primary),
      additional: additional.map((sampledAction) =>
        this.tooltipRangeForAction(combatant, sampledAction)
      ),
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
    const result = numericEnumKeyedRecord(SampledDamageContributingAttribute, () => 0);
    const equippedItems = [
      ...combatantProperties.equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: false }),
    ];
    const fromEquipment = Equipment.getAttributesOnEquipmentList(equippedItems);

    result[SampledDamageContributingAttribute.Strength] = fromEquipment[CombatAttribute.Strength];
    result[SampledDamageContributingAttribute.Dexterity] = fromEquipment[CombatAttribute.Dexterity];
    result[SampledDamageContributingAttribute.Spirit] = fromEquipment[CombatAttribute.Spirit];
    result[SampledDamageContributingAttribute.Accuracy] =
      fromEquipment[CombatAttribute.Accuracy] +
      fromEquipment[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO;

    // flat damage is not an attribute, so it is not in that record. weapon flat damage is already
    // inside the weapon's damage range, so only rings and amulets with +damage are counted here
    for (const equipment of equippedItems) {
      if (!equipment.isWeapon()) {
        result[SampledDamageContributingAttribute.FlatDamage] += equipment.getFlatDamageBonus();
      }
    }

    return result;
  }

  private contributionsFromAttributes(
    attributes: Record<CombatAttribute, number>
  ): ContributionsByAttribute {
    return {
      [SampledDamageContributingAttribute.Strength]: attributes[CombatAttribute.Strength],
      [SampledDamageContributingAttribute.Dexterity]: attributes[CombatAttribute.Dexterity],
      [SampledDamageContributingAttribute.Spirit]: attributes[CombatAttribute.Spirit],
      // you can't allocate to accuracy, but reading it the same way as inherent keeps the two
      // sources comparable
      [SampledDamageContributingAttribute.Accuracy]:
        attributes[CombatAttribute.Accuracy] +
        attributes[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO,
      [SampledDamageContributingAttribute.FlatDamage]: 0,
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

    return numericEnumKeyedRecord(SampledDamageContributingAttribute, (attribute) => ({
      fromGear: fromGear[attribute],
      allocated: allocated[attribute],
      inherent: inherent[attribute],
    }));
  }

  protected getCombatantReport(
    combatant: Combatant,
    sampledDamageOnDummy: number
  ): SampledDamageCombatantReport {
    const combatantProperties = combatant.getCombatantProperties();

    // the combatant has not changed since the solvers last scored it, so this re-reads the same
    // attacks sampledDamageOnDummy was averaged from rather than rolling new ones
    const { primaryUseCount, primaryLandedHitCount, primaryCriticalHitCount } = this
      .requireSampler(combatant)
      .sampleActionsOnTargetDummy(
        combatant,
        this.party.dungeonExplorationManager.getCurrentFloor()
      );

    return {
      ...this.commonCombatantFields(combatant),
      sampledDamageOnDummy,
      primaryUseCount,
      primaryLandedHitCount,
      primaryCriticalHitCount,
      tooltipDamage: this.getTooltipDamage(combatant),
      heldEquipment: this.getHeldEquipment(combatantProperties),
      contributingAttributes: this.getContributingAttributes(combatantProperties),
    };
  }
}
