import { CombatAttribute, Combatant, CombatantAttributeProperties } from "@speed-dungeon/common";

/** freezing or "holding" the attributes of a combatant turns their getTotalAttributes into
 * a read instead of an expensive calculation, which was measured to have a large effect when
 * simulating several sequential dungeon runs for analysis */
export class CombatantAttributesMemo {
  private computeTotalAttributes: () => Record<CombatAttribute, number>;
  private totalAttributesOption: null | Record<CombatAttribute, number> = null;
  private isHolding = false;

  constructor(combatant: Combatant) {
    const { attributeProperties } = combatant.getCombatantProperties();
    this.computeTotalAttributes =
      CombatantAttributeProperties.prototype.getTotalAttributes.bind(attributeProperties);

    attributeProperties.getTotalAttributes = () => ({ ...this.readTotalAttributes() });
    attributeProperties.getAttributeValue = (attribute: CombatAttribute) =>
      this.readTotalAttributes()[attribute];
  }

  private readTotalAttributes() {
    if (!this.isHolding) {
      return this.computeTotalAttributes();
    }
    if (this.totalAttributesOption === null) {
      this.totalAttributesOption = this.computeTotalAttributes();
    }
    return this.totalAttributesOption;
  }

  /** for a combatant nothing mutates for the lifetime of the run, such as a target dummy */
  holdIndefinitely() {
    this.isHolding = true;
    this.totalAttributesOption = null;
  }

  /** solvers mutate characters between reads, so a character only holds still for one read of it.
   * outside the read the combatant answers from live state as it always did */
  holdWhile<T>(read: () => T): T {
    this.isHolding = true;
    this.totalAttributesOption = null;
    try {
      return read();
    } finally {
      this.isHolding = false;
      this.totalAttributesOption = null;
    }
  }
}
