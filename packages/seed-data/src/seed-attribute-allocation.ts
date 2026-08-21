// this script is run straight from source with node's type stripping, which cannot tell a type
// import from a value one — so the types have to say so
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  ATTRIBUTE_POINTS_AWARDED_PER_LEVEL,
  COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import type {
  AttributePointAssignableAttributes,
  Combatant,
  CombatAttribute,
} from "@speed-dungeon/common";

export class SeedAttributeAllocation {
  // seeded characters have their level assigned rather than earned, so they never received the
  // levelup points a real character of that level would have. without spending those, a character
  // cannot meet the attribute requirements of the gear rolled for them and reads as wearing items
  // it cannot use
  allocate(combatant: Combatant): void {
    const { attributeProperties, classProgressionProperties, resources } =
      combatant.combatantProperties;
    const { level } = classProgressionProperties.getMainClass();
    attributeProperties.changeUnspentPoints(ATTRIBUTE_POINTS_AWARDED_PER_LEVEL * (level - 1));

    this.spendOnEquipmentRequirements(combatant);
    this.spendRemainderOnClassGrowth(combatant);

    // a levelup sets resources to max, and the level these characters were given never ran one
    resources.setToMax();
  }

  // cheapest unmet requirement first, which fits the most items into the points available. closing
  // one at a time and re-reading the totals lets an item that just became usable pay for the next:
  // its own attributes only count once its requirements are met
  private spendOnEquipmentRequirements(combatant: Combatant): void {
    const { attributeProperties } = combatant.combatantProperties;

    while (attributeProperties.getUnspentPoints() > 0) {
      const cheapest = this.cheapestUnmetRequirement(combatant);
      if (cheapest === undefined || cheapest.deficit > attributeProperties.getUnspentPoints()) {
        return;
      }
      for (let point = 0; point < cheapest.deficit; point += 1) {
        attributeProperties.allocatePoint(cheapest.attribute);
      }
    }
  }

  // both hotswap loadouts count: a character carrying a reserve weapon it cannot lift is the same
  // problem as one wearing armor it cannot lift
  private cheapestUnmetRequirement(
    combatant: Combatant
  ): undefined | { attribute: CombatAttribute; deficit: number } {
    const { attributeProperties, equipment } = combatant.combatantProperties;
    const totalAttributes = attributeProperties.getTotalAttributes();

    let cheapest: undefined | { attribute: CombatAttribute; deficit: number };
    for (const item of equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: true })) {
      for (const [attribute, required] of iterateNumericEnumKeyedRecord(item.requirements)) {
        if (
          !ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(
            attribute as AttributePointAssignableAttributes
          )
        ) {
          continue;
        }
        const deficit = required - (totalAttributes[attribute] || 0);
        if (deficit <= 0) {
          continue;
        }
        if (cheapest === undefined || deficit < cheapest.deficit) {
          cheapest = { attribute, deficit };
        }
      }
    }

    return cheapest;
  }

  // whatever is left goes where the class itself grows, so a warrior reads as a strength build and a
  // mage as a spirit one rather than every character having the same spread
  private spendRemainderOnClassGrowth(combatant: Combatant): void {
    const { attributeProperties, classProgressionProperties } = combatant.combatantProperties;
    const growthPerLevel =
      COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL[classProgressionProperties.getMainClass().combatantClass];

    const weights = new Map<CombatAttribute, number>();
    for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
      const weight = growthPerLevel[attribute] || 0;
      if (weight > 0) {
        weights.set(attribute, weight);
      }
    }
    if (weights.size === 0) {
      throw new Error("expected every class to grow in at least one assignable attribute");
    }

    const allocated = new Map<CombatAttribute, number>();
    while (attributeProperties.getUnspentPoints() > 0) {
      const attribute = this.furthestBehindItsWeight(weights, allocated);
      attributeProperties.allocatePoint(attribute);
      allocated.set(attribute, (allocated.get(attribute) || 0) + 1);
    }
  }

  // highest weight per point already given, so the spread converges on the weights themselves
  private furthestBehindItsWeight(
    weights: Map<CombatAttribute, number>,
    allocated: Map<CombatAttribute, number>
  ): CombatAttribute {
    let furthestBehind: undefined | { attribute: CombatAttribute; share: number };
    for (const [attribute, weight] of weights) {
      const share = weight / ((allocated.get(attribute) || 0) + 1);
      if (furthestBehind === undefined || share > furthestBehind.share) {
        furthestBehind = { attribute, share };
      }
    }
    if (furthestBehind === undefined) {
      throw new Error("expected a weighted attribute to allocate to");
    }
    return furthestBehind.attribute;
  }
}
