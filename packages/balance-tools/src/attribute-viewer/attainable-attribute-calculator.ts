import {
  AffixGenerator,
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  BodyArmor,
  BodyArmorBaseItemType,
  BodyArmorProperties,
  CombatAttribute,
  DEEPEST_FLOOR,
  Equipment,
  EquipmentBaseItem,
  EquipmentBaseItemType,
  EquipmentBuilder,
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

export class AttainableAttributeCalculator {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(1);
  private randomizer = new EquipmentRandomizer(this.rngPolicy, new AffixGenerator(this.rngPolicy));
  private equipmentBuilder = new ItemBuilder(this.randomizer);
  // "all possible" meaning possible for that equipment based on it's template
  private maxRolledEquipmentWithAllPossibleAffixes: Partial<Record<EquipmentType, Equipment[]>> =
    {};
  constructor() {
    this.createAllEquipmentWithMaxRolls();
  }

  private addMaxAllPossibleAffixesToEquipmentBuilder(builder: EquipmentBuilder) {
    for (const [prefixType, maxTier] of iterateNumericEnumKeyedRecord(
      builder.template.possibleAffixes.prefix
    )) {
      builder.prefix(prefixType, { tier: maxTier });
    }
    for (const [suffixType, maxTier] of iterateNumericEnumKeyedRecord(
      builder.template.possibleAffixes.suffix
    )) {
      builder.suffix(suffixType, { tier: maxTier });
    }
  }

  private createOneOfEachEquipmentBuilderInCategory(equipmentType: EquipmentType) {
    const builders: EquipmentBuilder[] = [];
    for (const baseItem of iterateNumericEnum(BASE_ITEMS_BY_EQUIPMENT_TYPE[equipmentType])) {
      switch (equipmentType) {
        case EquipmentType.BodyArmor:
          builders.push(this.equipmentBuilder.bodyArmor(parseInt(baseItem)));
          break;
        case EquipmentType.HeadGear:
          builders.push(this.equipmentBuilder.headGear(parseInt(baseItem)));
          break;
        case EquipmentType.Ring:
          builders.push(this.equipmentBuilder.ring());
          break;
        case EquipmentType.Amulet:
          builders.push(this.equipmentBuilder.amulet());
          break;
        case EquipmentType.OneHandedMeleeWeapon:
          builders.push(this.equipmentBuilder.oneHandedMeleeWeapon(parseInt(baseItem)));
          break;
        case EquipmentType.TwoHandedMeleeWeapon:
          builders.push(this.equipmentBuilder.twoHandedMeleeWeapon(parseInt(baseItem)));
          break;
        case EquipmentType.TwoHandedRangedWeapon:
          builders.push(this.equipmentBuilder.twoHandedRangedWeapon(parseInt(baseItem)));
          break;
        case EquipmentType.Shield:
          builders.push(this.equipmentBuilder.shield(parseInt(baseItem)));
          break;
      }
    }

    return builders;
  }

  private createAllEquipmentWithMaxRolls() {
    for (const equipmentType of iterateNumericEnum(EquipmentType)) {
      const builders = this.createOneOfEachEquipmentBuilderInCategory(equipmentType);
      for (const builder of builders) {
        this.addMaxAllPossibleAffixesToEquipmentBuilder(builder);
        const equipment = builder.build(this.idGenerator);
        const template = getEquipmentTemplateCatalog().getTemplate(
          equipment.equipmentBaseItemProperties
        );
        this.randomizer.rerollAffixValues(equipment, template);
        const equipmentOfThisType =
          this.maxRolledEquipmentWithAllPossibleAffixes[equipmentType] ?? [];
        equipmentOfThisType.push(equipment);
        this.maxRolledEquipmentWithAllPossibleAffixes[equipmentType] = equipmentOfThisType;
      }
    }
  }

  private fromEquipment(attribute: CombatAttribute, weaponSpecialty: CharacterWeaponSpecialty) {
    //
  }

  private fromMainClassInherent() {}
  private fromSupportClassInherent() {}
  private fromDiscretionaryPoints() {}
}
