import {
  CombatAttribute,
  DERIVED_ATTRIBUTE_RATIOS,
  Equipment,
  invariant,
} from "@speed-dungeon/common";

/** Accuracy an item carries, split by where it comes from. Dexterity is included at the ratio the
 * game derives accuracy with, so the two figures are in the same unit and can be summed. */
export interface AccuracySources {
  fromAccuracyAffixes: number;
  fromDexterity: number;
}

export class EquipmentAccuracy {
  static of(equipment: Equipment): AccuracySources {
    let accuracy = 0;
    let dexterity = 0;

    for (const attributes of EquipmentAccuracy.attributeRecordsOf(equipment)) {
      accuracy += attributes[CombatAttribute.Accuracy] ?? 0;
      dexterity += attributes[CombatAttribute.Dexterity] ?? 0;
    }

    return {
      fromAccuracyAffixes: accuracy,
      fromDexterity: dexterity * EquipmentAccuracy.getDexterityToAccuracyRatio(),
    };
  }

  static total(sources: AccuracySources) {
    return sources.fromAccuracyAffixes + sources.fromDexterity;
  }

  static scoreOf(equipment: Equipment) {
    return EquipmentAccuracy.total(EquipmentAccuracy.of(equipment));
  }

  static sum(sources: AccuracySources[]): AccuracySources {
    return sources.reduce(
      (accumulated, current) => ({
        fromAccuracyAffixes: accumulated.fromAccuracyAffixes + current.fromAccuracyAffixes,
        fromDexterity: accumulated.fromDexterity + current.fromDexterity,
      }),
      { fromAccuracyAffixes: 0, fromDexterity: 0 }
    );
  }

  /** The same two places getCombatantTotalAttributes reads an equipped item's attributes from, so a
   * new source of accuracy is counted here without this having to know which affix carries it. */
  private static attributeRecordsOf(equipment: Equipment) {
    const affixAttributes = equipment.iterateAffixes().map((affix) => affix.combatAttributes);
    return [equipment.attributes, ...affixAttributes];
  }

  private static getDexterityToAccuracyRatio() {
    const ratio = DERIVED_ATTRIBUTE_RATIOS[CombatAttribute.Dexterity]?.[CombatAttribute.Accuracy];
    invariant(ratio !== undefined, "dexterity no longer derives accuracy");
    return ratio;
  }
}
