import {
  AdventuringParty,
  AffixType,
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

  private getGearContributions(combatantProperties: CombatantProperties): ContributionsByAttribute {
    const result = numericEnumKeyedRecord(AttackDamageContributingAttribute, () => 0);

    for (const equipment of combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    })) {
      const strength = equipment.getAffixAttributeValue(
        AffixType.Strength,
        CombatAttribute.Strength
      );
      const dexterity = equipment.getAffixAttributeValue(
        AffixType.Dexterity,
        CombatAttribute.Dexterity
      );
      const accuracy = equipment.getAffixAttributeValue(
        AffixType.Accuracy,
        CombatAttribute.Accuracy
      );

      result[AttackDamageContributingAttribute.Strength] += strength;
      result[AttackDamageContributingAttribute.Dexterity] += dexterity;
      result[AttackDamageContributingAttribute.Accuracy] +=
        accuracy + dexterity * DEX_TO_ACCURACY_RATIO;

      // weapon flat damage is already inside the weapon's damage range, so only rings and amulets
      // with +damage are counted here
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
    const { classProgressionProperties } = combatantProperties;

    // the combatant has not changed since the solvers last scored it, so this re-reads the same
    // attacks sampledDamageOnDummy was averaged from rather than rolling new ones
    const { mainHandSwingCount, mainHandLandedHitCount, mainHandCriticalHitCount } =
      this.goalPerformanceChecker.sampleAttacksOnTargetDummy(
        combatant,
        this.party.dungeonExplorationManager.getCurrentFloor()
      );

    return {
      sampledDamageOnDummy,
      mainHandSwingCount,
      mainHandLandedHitCount,
      mainHandCriticalHitCount,
      tooltipDamage: this.getTooltipDamage(combatant),
      heldEquipment: this.getHeldEquipment(combatantProperties),
      contributingAttributes: this.getContributingAttributes(combatantProperties),
      mainClassLevel: classProgressionProperties.getMainClass().level,
      supportClassLevel: classProgressionProperties.getSupportClassOption()?.level,
    };
  }
}
