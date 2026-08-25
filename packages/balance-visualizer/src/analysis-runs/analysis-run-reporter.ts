import {
  AdventuringParty,
  AffixType,
  COMBAT_ACTIONS,
  Combatant,
  CombatantId,
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
} from "@speed-dungeon/common";
import {
  EquipmentBaseItemTally,
  TalliedBaseItem,
} from "@/analysis-subjects/equipment-base-item-tally";

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

export type CombatantAttackContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number }
>;

interface AttackDamageCombatantReport {
  sampledDamageOnDummy: number;
  tooltipDamage: CombatantReportTooltipDamage;
  heldEquipment: Record<HoldableSlotId, Equipment | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
  mainClassLevel: number;
  supportClassLevel: number | undefined;
}

export interface AttackDamageRoomReport {
  /** every base item dropped since the run began, not only this room's drops */
  cumulativeAvailableEquipment: TalliedBaseItem[];
  combatantReports: Map<CombatantId, AttackDamageCombatantReport>;
}

export type RunReport<T> = { floor: number; room: number; roomReport: T }[];

export interface AnalysisRunReporter<T> {
  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ): void;
  runReport: RunReport<T>;
}

export class AttackDamageRunReporter implements AnalysisRunReporter<AttackDamageRoomReport> {
  private _runReport: RunReport<AttackDamageRoomReport> = [];
  private cumulativeAvailableEquipment = new EquipmentBaseItemTally();

  constructor(private party: AdventuringParty) {}

  get runReport() {
    return this._runReport;
  }

  private getTooltipDamage(combatant: Combatant) {
    const weaponsHeld = combatant.getWeaponsInSlots(
      [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand],
      { usableWeaponsOnly: false }
    );
    const mhOption = weaponsHeld[EquipmentSlotId.MainHand];
    const mainhandAttackActionName = getAttackActionName(mhOption?.weaponProperties, {
      isOffHand: false,
    });
    const mhAttackAction = COMBAT_ACTIONS[mainhandAttackActionName];

    const mhTooltip = getTooltipOffensiveSpec(mhAttackAction, combatant);
    invariant(mhTooltip !== undefined);

    const tooltipDamage: CombatantReportTooltipDamage = {
      [EquipmentSlotId.MainHand]: mhTooltip.hpChangeRange,
      [EquipmentSlotId.OffHand]: null,
    };

    const ohEquipmentOption = combatant
      .getCombatantProperties()
      .equipment.getEquipmentInSlot(EquipmentSlotId.OffHand);
    if (!mhOption?.equipment.isTwoHanded() && !ohEquipmentOption?.isShield()) {
      const ohOption = weaponsHeld[EquipmentSlotId.OffHand];
      const offhandAttackActionName = getAttackActionName(ohOption?.weaponProperties, {
        isOffHand: true,
      });
      const ohAttackAction = COMBAT_ACTIONS[offhandAttackActionName];
      const ohTooltip = getTooltipOffensiveSpec(ohAttackAction, combatant);
      invariant(ohTooltip?.hpChangeRange !== undefined);
      tooltipDamage[EquipmentSlotId.OffHand] = ohTooltip.hpChangeRange;
    }

    return tooltipDamage;
  }

  private getHeldEquipment(combatantProperties: CombatantProperties) {
    const equipmentProperties = combatantProperties.equipment;
    return {
      [EquipmentSlotId.MainHand]: equipmentProperties.getEquipmentInSlot(EquipmentSlotId.MainHand),
      [EquipmentSlotId.OffHand]: equipmentProperties.getEquipmentInSlot(EquipmentSlotId.OffHand),
    };
  }

  private getContributingAttributesOnEquipment(equipment: Equipment) {
    const strength = equipment.getAffixAttributeValue(AffixType.Strength, CombatAttribute.Strength);
    const dexterity = equipment.getAffixAttributeValue(
      AffixType.Dexterity,
      CombatAttribute.Dexterity
    );
    let accuracy = equipment.getAffixAttributeValue(AffixType.Accuracy, CombatAttribute.Accuracy);
    accuracy += dexterity * DEX_TO_ACCURACY_RATIO;

    // weapon flat damage already included in the weapon's damage range
    // so we're only interested in counting rings/amulets with +damage
    let flatDamage = 0;
    if (!equipment.isWeapon()) {
      flatDamage = equipment.getFlatDamageBonus();
    }

    return { strength, dexterity, accuracy, flatDamage };
  }

  private getContributingAttributes(
    combatantProperties: CombatantProperties
  ): CombatantAttackContributingAttributes {
    // from equipment
    const contributionsFromEquipped: Record<AttackDamageContributingAttribute, number> = {
      [AttackDamageContributingAttribute.Strength]: 0,
      [AttackDamageContributingAttribute.Dexterity]: 0,
      [AttackDamageContributingAttribute.Accuracy]: 0,
      [AttackDamageContributingAttribute.FlatDamage]: 0,
    };

    for (const equipment of combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    })) {
      const { strength, dexterity, accuracy, flatDamage } =
        this.getContributingAttributesOnEquipment(equipment);
      contributionsFromEquipped[AttackDamageContributingAttribute.Strength] += strength;
      contributionsFromEquipped[AttackDamageContributingAttribute.Dexterity] += dexterity;
      contributionsFromEquipped[AttackDamageContributingAttribute.Accuracy] += accuracy;
      contributionsFromEquipped[AttackDamageContributingAttribute.FlatDamage] += flatDamage;
    }

    // from allocated points
    const { attributeProperties } = combatantProperties;
    const allocated = attributeProperties.getAllocatedAttributes();
    const accuracyFromAllocated =
      allocated[CombatAttribute.Accuracy] + // you can't allocate to accuracy, but for consistency
      allocated[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO;

    // from inherent
    const inherent = attributeProperties.getInherentAttributes();
    const accuracyFromInherent =
      inherent[CombatAttribute.Accuracy] +
      inherent[CombatAttribute.Dexterity] * DEX_TO_ACCURACY_RATIO;

    return {
      [AttackDamageContributingAttribute.Strength]: {
        fromGear: contributionsFromEquipped[AttackDamageContributingAttribute.Strength],
        allocated: allocated[CombatAttribute.Strength],
        inherent: inherent[CombatAttribute.Strength],
      },
      [AttackDamageContributingAttribute.Dexterity]: {
        fromGear: contributionsFromEquipped[AttackDamageContributingAttribute.Dexterity],
        allocated: allocated[CombatAttribute.Dexterity],
        inherent: inherent[CombatAttribute.Dexterity],
      },
      [AttackDamageContributingAttribute.Accuracy]: {
        fromGear: contributionsFromEquipped[AttackDamageContributingAttribute.Accuracy],
        allocated: accuracyFromAllocated,
        inherent: accuracyFromInherent,
      },
      [AttackDamageContributingAttribute.FlatDamage]: {
        fromGear: contributionsFromEquipped[AttackDamageContributingAttribute.FlatDamage],
        allocated: 0,
        inherent: 0,
      },
    };
  }

  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ) {
    this.cumulativeAvailableEquipment.addAllEquipment(equipmentDroppedThisRoom);

    const roomReport = {
      cumulativeAvailableEquipment: this.cumulativeAvailableEquipment.entries(),
      combatantReports: new Map<CombatantId, AttackDamageCombatantReport>(),
    };

    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const sampledDamageOnDummy = goalPerformanceByCharacter.get(combatant.getEntityId());
      invariant(sampledDamageOnDummy !== undefined);
      const combatantProperties = combatant.getCombatantProperties();
      const { classProgressionProperties } = combatantProperties;

      const combatantReport = {
        sampledDamageOnDummy,
        tooltipDamage: this.getTooltipDamage(combatant),
        heldEquipment: this.getHeldEquipment(combatantProperties),
        contributingAttributes: this.getContributingAttributes(combatantProperties),
        mainClassLevel: classProgressionProperties.getMainClass().level,
        supportClassLevel: classProgressionProperties.getSupportClassOption()?.level,
      };

      roomReport.combatantReports.set(combatant.getEntityId(), combatantReport);
    }

    const { dungeonExplorationManager } = this.party;
    this._runReport.push({
      floor: dungeonExplorationManager.getCurrentFloor(),
      room: dungeonExplorationManager.getCurrentRoomNumber(),
      roomReport,
    });
  }
}
