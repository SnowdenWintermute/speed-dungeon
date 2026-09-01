import {
  AffixGenerator,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  AttributePointAssignableAttributes,
  ClassProgressionProperties,
  Combatant,
  COMBATANT_MAX_LEVEL,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  EquipmentBuilder,
  EquipmentRandomizer,
  EquipmentType,
  GAME_CONFIG,
  IdGeneratorRandom,
  ItemBuilder,
  iterateNumericEnum,
  RandomNumberGenerationPolicyFactory,
  Username,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";

export class AttainableAttributeCalculator {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(1);
  private randomizer = new EquipmentRandomizer(this.rngPolicy, new AffixGenerator(this.rngPolicy));
  private equipmentBuilder = new ItemBuilder(this.randomizer);

  private fromEquipment(
    combatant: Combatant,
    weaponSpecialty: CharacterWeaponSpecialty,
    attribute: CombatAttribute
  ) {
    // - sequentially build each equipment to maximize an attribute
    //   - build with each possible prefix at max tier on max floor for this equipment
    //   - try on equipment ignoring requirements
    //   - check if beats current best
    //   - try with each possible suffix
    // - we should now have one of each equipment with maximum contribution
    //   to the chosen attribute
    // - figure out at what threshold of each requirement attribute
    //   which equipment become available
    //     - at 5 strength: [ short sword ]
    //     - at 5 strength 3 dex: [short sword, blade ]
    //     - at 10 strength 5 dex:[short sword, blade , broad sword]
    // - for each threshold, get the best in slot for all slots
    //   which serve the chased attribute
    // - rank the thresholds by their best in slot sets' total chased attribute
    // - for each threshold's best in slot set's attribute, if the threshold requirements
    //   include attributes that don't contribute to the chased attribute, and another
    //   discretionary attribute could have contributed to it, reduce its score by that amount
    //   (example, we are chasing Hp, a set with +50 hp is at a threshold that requires 10 strength and 5 dex. We could have
    //   put those 15 points into Vitality instead, thereby increasing Hp by the Vitalit:Hp ratio, so
    //   reduce the score of this set by that amount) (example 2: we're chasing accuracy, a set with +10 accuracy
    //   requires 10 strength and 5 dex to wear. We reduce score by 10*dex:accuracy ratio, since the required dex
    //   is contributing to our chased attribute)
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
