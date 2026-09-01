import {
  AffixCategory,
  AffixGenerator,
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
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import cloneDeep from "lodash.clonedeep";

export class BestEquipmentPerBaseItemSelector {
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

  buildEquipmentOptionsForCombatantChasingAttribute(
    combatant: Combatant,
    specialty: CharacterWeaponSpecialty,
    attribute: CombatAttribute
  ) {
    const clonedEquipmentByBaseItemType = cloneDeep(this.baseEquipmentByType);
    for (const [equipmentType, baseItems] of clonedEquipmentByBaseItemType) {
      for (const [baseItem, equipment] of baseItems) {
        const template = getEquipmentTemplateCatalog().getTemplate(baseItem);
        const { possibleAffixes } = template;
        const { prefix: possiblePrefixes, suffix: possibleSuffixes } = possibleAffixes;
        // get all prefix options
        for (const [prefixType, maxTier] of iterateNumericEnumKeyedRecord(possiblePrefixes)) {
          // roll max each one in turn
          const existingPrefixes = equipment.affixes[AffixCategory.Prefix] || {};
          existingPrefixes[prefixType] = { tier: maxTier };
          this.equipmentRandomizer.rerollAffixValues(equipment, template);
          equipment.affixes[AffixCategory.Prefix] = existingPrefixes;
          // try on after each one
          // keep best scoring one
        }
      }
    }
    // - sequentially build each equipment to maximize an attribute
    //   - build with each possible prefix at max tier on max floor for this equipment
    //   - try on equipment ignoring requirements
    //   - check if beats current best
    //   - try with each possible suffix
    // - we should now have one of each equipment with maximum contribution
  }
}
