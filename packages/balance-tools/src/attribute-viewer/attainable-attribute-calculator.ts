import {
  AffixCategory,
  AffixGenerator,
  AffixType,
  Amulet,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  AttributePointAssignableAttributes,
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  BodyArmor,
  ClassProgressionProperties,
  Combatant,
  COMBATANT_MAX_LEVEL,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  Equipment,
  EquipmentBuilder,
  EquipmentRandomizer,
  EquipmentSlotId,
  EquipmentType,
  GAME_CONFIG,
  getEquipmentTemplateCatalog,
  HeadGear,
  IdGeneratorRandom,
  invariant,
  ItemBuilder,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
  OneHandedMeleeWeapon,
  RandomNumberGenerationPolicyFactory,
  Ring,
  Shield,
  TaggedAffixType,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  Username,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";
import cloneDeep from "lodash.clonedeep";

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

  private getDesiredAffixTypes(combatAttribute: CombatAttribute): TaggedAffixType[] {
    switch (combatAttribute) {
      case CombatAttribute.Strength: {
        return [{ affixCategory: AffixCategory.Suffix, suffixType: AffixType.Strength }];
      }
      case CombatAttribute.Dexterity: {
        return [{ affixCategory: AffixCategory.Suffix, suffixType: AffixType.Dexterity }];
      }
      case CombatAttribute.Spirit: {
        return [{ affixCategory: AffixCategory.Suffix, suffixType: AffixType.Spirit }];
      }
      case CombatAttribute.Vitality: {
        return [{ affixCategory: AffixCategory.Suffix, suffixType: AffixType.Vitality }];
      }
      case CombatAttribute.Agility: {
        return [{ affixCategory: AffixCategory.Prefix, prefixType: AffixType.Agility }];
      }
      case CombatAttribute.Speed: {
        return [{ affixCategory: AffixCategory.Prefix, prefixType: AffixType.Agility }];
      }
      case CombatAttribute.ArmorClass: {
        return [
          { affixCategory: AffixCategory.Prefix, prefixType: AffixType.FlatArmorClass },
          { affixCategory: AffixCategory.Suffix, suffixType: AffixType.PercentArmorClass },
        ];
      }
      case CombatAttribute.ArmorPenetration: {
        return [{ affixCategory: AffixCategory.Prefix, prefixType: AffixType.ArmorPenetration }];
      }
      case CombatAttribute.Accuracy: {
        return [
          { affixCategory: AffixCategory.Prefix, prefixType: AffixType.Accuracy },
          { affixCategory: AffixCategory.Suffix, suffixType: AffixType.Dexterity },
        ];
      }
      case CombatAttribute.Evasion: {
        return [
          { affixCategory: AffixCategory.Prefix, prefixType: AffixType.Evasion },
          { affixCategory: AffixCategory.Prefix, prefixType: AffixType.Agility },
        ];
      }
      case CombatAttribute.Hp: {
        return [
          { affixCategory: AffixCategory.Suffix, suffixType: AffixType.Hp },
          { affixCategory: AffixCategory.Suffix, suffixType: AffixType.Vitality },
        ];
      }
      case CombatAttribute.Mp: {
        return [
          { affixCategory: AffixCategory.Prefix, prefixType: AffixType.Mp },
          { affixCategory: AffixCategory.Suffix, suffixType: AffixType.Spirit },
        ];
      }
    }
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

  private getBestInSlotEquipmentOfType(equipmentType: EquipmentType) {
    switch (equipmentType) {
      case EquipmentType.BodyArmor: {
        return BodyArmor.FullPlate;
      }
      case EquipmentType.HeadGear: {
        return HeadGear.FullHelm;
      }
      case EquipmentType.Ring: {
        return Ring.Ring;
      }
      case EquipmentType.Amulet: {
        return Amulet.Amulet;
      }
      case EquipmentType.OneHandedMeleeWeapon: {
        return OneHandedMeleeWeapon.BastardSword;
      }
      case EquipmentType.TwoHandedMeleeWeapon: {
        return TwoHandedMeleeWeapon.GravityHammer;
      }
      case EquipmentType.TwoHandedRangedWeapon: {
        return TwoHandedRangedWeapon.MilitaryBow;
      }
      case EquipmentType.Shield: {
        return Shield.GothicShield;
      }
    }
  }

  private fromEquipment(
    combatant: Combatant,
    weaponSpecialty: CharacterWeaponSpecialty,
    attribute: CombatAttribute
  ) {
    for (const slotId of iterateNumericEnum(EquipmentSlotId)) {
      const compatibleEquipmentTypes =
        AnalysisCharacterSpecification.equipmentSpecialtyCompatibleEquipmentTypesForSlot(
          weaponSpecialty,
          slotId
        );
      const equipmentType = compatibleEquipmentTypes[0];
      invariant(equipmentType !== undefined);
      const bestInSlotBaseItemType = this.getBestInSlotEquipmentOfType(equipmentType);
      const equipment = this.maxRolledEquipmentWithAllPossibleAffixes[equipmentType]?.find(
        (equipment) => equipment.equipmentBaseItemProperties.baseItemType === bestInSlotBaseItemType
      );

      if (equipment === undefined) {
        continue;
      }

      const clonedEquipment = cloneDeep(equipment);

      clonedEquipment.requirements = {};
      for (const affix of clonedEquipment.iterateAffixes()) {
        const affixesRelatedToQueriedAttribute = [];
      }

      combatant.combatantProperties.equipment.putEquipmentInSlot(clonedEquipment, slotId);
    }
  }

  private fromMainClassInherent() {}
  private fromSupportClassInherent() {}

  private fromDiscretionaryPoints(combatant: Combatant, attribute: CombatAttribute) {
    if (
      !ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(
        attribute as AttributePointAssignableAttributes
      )
    ) {
      return 0;
    }

    const { combatantProperties } = combatant;
    const { attributeProperties, classProgressionProperties } = combatantProperties;
    const mainClassLevel = classProgressionProperties.getMainClass().level;
    const supportClassLevel = classProgressionProperties.getSupportClassOption()?.level || 0;
    for (let level = 2; level <= mainClassLevel; level += 1) {
      attributeProperties.changeUnspentPoints(GAME_CONFIG.ATTRIBUTE_POINTS_AWARDED_PER_LEVEL);
    }
    for (let level = 1; level <= supportClassLevel; level += 1) {
      attributeProperties.changeUnspentPoints(
        GAME_CONFIG.ATTRIBUTE_POINTS_AWARDED_PER_SUPPORT_CLASS_LEVEL
      );
    }

    attributeProperties.setSpeccedAttributeValue(attribute, attributeProperties.getUnspentPoints());

    return attributeProperties.getUnspentPoints();
  }

  getMaxAttainable(
    mainClass: CombatantClass,
    supportClassOption: CombatantClass | null,
    specialty: CharacterWeaponSpecialty,
    attribute: CombatAttribute
  ) {
    const combatantBuilder = CombatantBuilder.playerCharacter(mainClass, "" as Username).level(
      COMBATANT_MAX_LEVEL
    );
    if (supportClassOption !== null) {
      combatantBuilder.supportClass(
        supportClassOption,
        ClassProgressionProperties.maxSupportClassLevel(COMBATANT_MAX_LEVEL)
      );
    }
    const combatant = combatantBuilder.build(this.idGenerator);
    this.fromEquipment(combatant, specialty, attribute);
    const fromDiscretionaryPoints = this.fromDiscretionaryPoints(combatant, attribute);
    console.log("fromDiscretionaryPoints", fromDiscretionaryPoints);

    return combatant.getTotalAttributes();
  }
}
