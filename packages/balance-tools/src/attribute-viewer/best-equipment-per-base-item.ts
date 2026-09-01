import {
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
  MapUtils,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";

export class BestEquipmentPerBaseItemSelector {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(1);
  private randomizer = new EquipmentRandomizer(this.rngPolicy, new AffixGenerator(this.rngPolicy));
  private equipmentBuilder = new ItemBuilder(this.randomizer);
  private baseEquipmentByType = new Map<EquipmentType, Map<EquipmentBaseItem, Equipment[]>>();

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
    const equipment = new Map<EquipmentBaseItem, Equipment[]>();

    baseItems.map((baseItem) => {
      const equipmentList = MapUtils.getOrCreate(equipment, baseItem, () => {
        return [];
      });
      equipmentList.push(
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
    // - sequentially build each equipment to maximize an attribute
    //   - build with each possible prefix at max tier on max floor for this equipment
    //   - try on equipment ignoring requirements
    //   - check if beats current best
    //   - try with each possible suffix
    // - we should now have one of each equipment with maximum contribution
  }
}
