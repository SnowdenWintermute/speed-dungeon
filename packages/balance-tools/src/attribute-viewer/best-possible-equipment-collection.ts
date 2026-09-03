import {
  Affix,
  AffixCategory,
  AffixGenerator,
  AffixType,
  Combatant,
  CombatAttribute,
  Equipment,
  EQUIPMENT_BASE_ITEMS_BY_TYPE,
  EquipmentBaseItem,
  EquipmentRandomizer,
  EquipmentType,
  getEquipmentTemplateCatalog,
  IdGeneratorRandom,
  ItemBuilder,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export class BestPossibleEquipmentCollection {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(1);
  private equipmentRandomizer = new EquipmentRandomizer(
    this.rngPolicy,
    new AffixGenerator(this.rngPolicy)
  );
  private equipmentBuilder = new ItemBuilder(this.equipmentRandomizer);
  private baseEquipmentByType = new Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>();

  constructor() {
    for (const equipmentType of iterateNumericEnum(EquipmentType)) {
      this.baseEquipmentByType.set(
        equipmentType,
        this.createOneOfEachEquipmentOfType(equipmentType)
      );
    }
  }

  private getMaxItemLevel(baseItem: EquipmentBaseItem) {
    return getEquipmentTemplateCatalog().getTemplate(baseItem).levelRange.max;
  }

  private createOneOfEachEquipmentOfType(equipmentType: EquipmentType) {
    const baseItems: EquipmentBaseItem[] = EQUIPMENT_BASE_ITEMS_BY_TYPE[equipmentType];
    const equipment = new Map<EquipmentBaseItem, Equipment>();

    baseItems.map((baseItem) => {
      equipment.set(
        baseItem,
        this.equipmentBuilder
          .equipment(baseItem)
          .itemLevel(this.getMaxItemLevel(baseItem))
          .build(this.idGenerator)
      );
    });

    return equipment;
  }

  private testAffixesOnEquipmentUntilBestAssigned(
    combatant: Combatant,
    chasedAttribute: CombatAttribute,
    baseItem: EquipmentBaseItem,
    equipment: Equipment
  ) {
    // remove requirements while trying item, put back after
    const savedRequirements = equipment.requirements;
    equipment.requirements = {};
    const template = getEquipmentTemplateCatalog().getTemplate(baseItem);
    const { possibleAffixes } = template;
    const { prefix: possiblePrefixes, suffix: possibleSuffixes } = possibleAffixes;

    const { combatantProperties } = combatant;
    const { attributeProperties } = combatantProperties;
    combatantProperties.inventory.insertItem(equipment);
    combatantProperties.equipment.equipItem(equipment.getEntityId(), false);

    const bestAffixByCategory: Partial<
      Record<AffixCategory, { affixType: AffixType; affix: Affix; score: number }>
    > = {};

    const affixListsByCategory: {
      list: Partial<Record<AffixType, number>>;
      category: AffixCategory;
    }[] = [
      { list: possiblePrefixes, category: AffixCategory.Prefix },
      { list: possibleSuffixes, category: AffixCategory.Suffix },
    ];

    for (const { list, category } of affixListsByCategory) {
      const baselineScore = attributeProperties.getAttributeValue(chasedAttribute);
      // get all prefix options
      for (const [affixType, maxTier] of iterateNumericEnumKeyedRecord(list)) {
        // roll max each one in turn
        const existingAffixes = equipment.affixes[category] || {};
        equipment.affixes[category] = existingAffixes;

        const maxTierModifiedByItemLevel = Math.round(
          AffixGenerator.getMaxTierModifiedByItemLevel(maxTier, equipment.itemLevel)
        );

        existingAffixes[affixType] = { tier: maxTierModifiedByItemLevel };
        // existingAffixes[affixType] = { tier: maxTier };
        this.equipmentRandomizer.rerollAffixValues(equipment, template);
        // try on after each one
        const totalWithAffix = attributeProperties.getAttributeValue(chasedAttribute);
        const score = totalWithAffix - baselineScore;
        // keep best scoring one
        const bestScoringAffix = bestAffixByCategory[category];
        const beatPreviousBest = bestScoringAffix === undefined || score > bestScoringAffix.score;
        if (score > 0 && beatPreviousBest) {
          bestAffixByCategory[category] = {
            affixType,
            affix: existingAffixes[affixType],
            score,
          };
        }
        equipment.affixes = {};
      }
    }

    combatantProperties.equipment.unequipAll();
    combatantProperties.inventory.deleteAllItems();
    equipment.requirements = savedRequirements;

    // assign best affixes to the equipment
    for (const [category, bestAffixOption] of iterateNumericEnumKeyedRecord(bestAffixByCategory)) {
      equipment.affixes[category] = { [bestAffixOption.affixType]: bestAffixOption.affix };
    }
  }

  buildEquipmentOptionsForCombatantChasingAttribute(
    combatant: Combatant,
    chasedAttribute: CombatAttribute
  ) {
    const { combatantProperties } = combatant;
    combatantProperties.equipment.unequipAll();
    const clonedEquipmentByBaseItemType = cloneDeep(this.baseEquipmentByType);

    for (const [equipmentType, baseItems] of clonedEquipmentByBaseItemType) {
      for (const [baseItem, equipment] of baseItems) {
        this.testAffixesOnEquipmentUntilBestAssigned(
          combatant,
          chasedAttribute,
          baseItem,
          equipment
        );
      }
    }

    return clonedEquipmentByBaseItemType;
  }
}
