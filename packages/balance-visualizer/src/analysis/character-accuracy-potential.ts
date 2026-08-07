import {
  ATTRIBUTE_POINTS_AWARDED_PER_SUPPORT_CLASS_LEVEL,
  CombatAttribute,
  Combatant,
  CombatantClass,
  COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
  getCombatantTotalAttributes,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

/** Accuracy a character could reach with no loot equipped, under choices the simulation never
 * makes: it spends no attribute points and reads no skill books. */
export interface AccuracyPotential {
  /** The character exactly as the run left them — points unspent, no support class. */
  asPlayed: number;
  withSupportClass: number;
  withMaxDexterity: number;
  withMaxDexterityAndSupportClass: number;
  /** What the allocation alone buys: the two above minus the dexterity the character already had
   * from class levels. A support class raises it by granting more points to allocate. */
  fromAllocatedPoints: number;
  fromAllocatedPointsWithSupportClass: number;
}

/** One value per variant. Lets the aggregation carry samples and distributions in the same shape,
 * so adding a variant above is the only place it has to be named. */
export type AccuracyPotentialRecord<TValue> = {
  [TVariant in keyof AccuracyPotential]: TValue;
};

export class CharacterAccuracyPotential {
  static of(combatant: Combatant): AccuracyPotential {
    // one clone reused across the variants: cloning a Combatant per variant per character per room
    // would be the most expensive thing this analysis does
    const clone = cloneDeep(combatant);
    const { classProgressionProperties, attributeProperties } = clone.combatantProperties;
    const { combatantClass, level } = classProgressionProperties.getMainClass();

    const speccedDexterity =
      attributeProperties.getNaturalAttributes()[CombatAttribute.Dexterity] ?? 0;
    const pointsFromLevels = attributeProperties.getUnspentPoints();
    const allPointsIntoDexterity = (extraPoints: number) =>
      attributeProperties.setSpeccedAttributeValue(
        CombatAttribute.Dexterity,
        speccedDexterity + pointsFromLevels + extraPoints
      );

    // read before any support class is set, since setSupportClass has no inverse
    const asPlayed = CharacterAccuracyPotential.readAccuracy(clone);
    allPointsIntoDexterity(0);
    const withMaxDexterity = CharacterAccuracyPotential.readAccuracy(clone);

    const supportClassLevel = CharacterAccuracyPotential.maxSupportClassLevel(level);
    if (supportClassLevel === 0) {
      return CharacterAccuracyPotential.assemble({
        asPlayed,
        withSupportClass: asPlayed,
        withMaxDexterity,
        withMaxDexterityAndSupportClass: withMaxDexterity,
      });
    }

    const pointsFromSupportClass =
      supportClassLevel * ATTRIBUTE_POINTS_AWARDED_PER_SUPPORT_CLASS_LEVEL;
    const supportClasses = CharacterAccuracyPotential.supportClassesFor(combatantClass);

    // averaged across the classes they could legally take rather than the one that happens to suit
    // accuracy, so this reads as a typical support class rather than an optimal one
    let supportedTotal = 0;
    let supportedWithDexterityTotal = 0;

    for (const supportClass of supportClasses) {
      classProgressionProperties.setSupportClass(supportClass, supportClassLevel);

      attributeProperties.setSpeccedAttributeValue(CombatAttribute.Dexterity, speccedDexterity);
      supportedTotal += CharacterAccuracyPotential.readAccuracy(clone);

      allPointsIntoDexterity(pointsFromSupportClass);
      supportedWithDexterityTotal += CharacterAccuracyPotential.readAccuracy(clone);
    }

    return CharacterAccuracyPotential.assemble({
      asPlayed,
      withSupportClass: supportedTotal / supportClasses.length,
      withMaxDexterity,
      withMaxDexterityAndSupportClass: supportedWithDexterityTotal / supportClasses.length,
    });
  }

  /** The allocation-only figures are differences of the four measured ones, so they come from the
   * real attribute pipeline rather than from re-deriving the dexterity to accuracy ratio here. */
  private static assemble(
    measured: Omit<AccuracyPotential, "fromAllocatedPoints" | "fromAllocatedPointsWithSupportClass">
  ): AccuracyPotential {
    return {
      ...measured,
      fromAllocatedPoints: measured.withMaxDexterity - measured.asPlayed,
      fromAllocatedPointsWithSupportClass:
        measured.withMaxDexterityAndSupportClass - measured.withSupportClass,
    };
  }

  static mean(potentials: AccuracyPotential[]): AccuracyPotential {
    invariant(potentials.length > 0, "cannot average the potential of no characters");
    const mean = (variant: keyof AccuracyPotential) =>
      potentials.reduce((sum, potential) => sum + potential[variant], 0) / potentials.length;

    return {
      asPlayed: mean("asPlayed"),
      withSupportClass: mean("withSupportClass"),
      withMaxDexterity: mean("withMaxDexterity"),
      withMaxDexterityAndSupportClass: mean("withMaxDexterityAndSupportClass"),
      fromAllocatedPoints: mean("fromAllocatedPoints"),
      fromAllocatedPointsWithSupportClass: mean("fromAllocatedPointsWithSupportClass"),
    };
  }

  /** The rule ReadSkillBook enforces: a read is refused once support level has reached half the
   * main class level. Reaching it also needs a book of item level above the current support level,
   * so treat this as the ceiling rather than what a run actually attains. */
  static maxSupportClassLevel(mainClassLevel: number) {
    return Math.floor(mainClassLevel / 2);
  }

  /** Every class but their own — ReadSkillBook refuses a book of your own main class. */
  static supportClassesFor(mainClass: CombatantClass) {
    const supportClasses = iterateNumericEnumKeyedRecord(COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL)
      .map(([combatantClass]) => combatantClass)
      .filter((combatantClass) => combatantClass !== mainClass);

    invariant(supportClasses.length > 0, "no support class exists for the only combatant class");
    return supportClasses;
  }

  private static readAccuracy(combatant: Combatant) {
    // the free function rather than combatant.getTotalAttributes(), which is an arrow-function
    // property and so stays bound to whatever this was cloned from
    return getCombatantTotalAttributes(combatant.combatantProperties)[CombatAttribute.Accuracy] ?? 0;
  }
}
