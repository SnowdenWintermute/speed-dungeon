import {
  FOUND_ITEM_MAX_DURABILITY_MODIFIER,
  FOUND_ITEM_MIN_DURABILITY_MODIFIER,
  BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL,
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER,
} from "../../../app-consts.js";
import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { randBetween } from "../../../utils/rand-between.js";
import { AffixCategory, EquipmentAffixes, GuaranteedAffixes } from "../../equipment/affixes.js";
import { Equipment } from "../../equipment/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import {
  ArmorGenerationTemplate,
  EquipmentGenerationTemplate,
  WeaponGenerationTemplate,
} from "../equipment-templates/base-templates.js";
import { ShieldGenerationTemplate } from "../equipment-templates/shields.js";
import { AffixGenerator } from "../affix-generator.js";
import cloneDeep from "lodash.clonedeep";
import { invariant } from "../../../utils/index.js";
import { getEquipmentGenerationTemplate } from "../equipment-templates/index.js";

export class EquipmentRandomizer {
  constructor(
    private rngPolicy: RandomNumberGenerationPolicy,
    private affixGenerator: AffixGenerator
  ) {}

  rollArmorClass(acRange: NumberRange): number {
    return randBetween(acRange.min, acRange.max, this.rngPolicy.equipmentBaseProperties);
  }

  rollDamageClassifications(template: WeaponGenerationTemplate): ResourceChangeSource[] {
    const shuffled = ArrayUtils.shuffle(
      cloneDeep(template.possibleDamageClassifications),
      this.rngPolicy.equipmentBaseProperties
    );
    const result: ResourceChangeSource[] = [];
    for (let i = 0; i < template.numDamageClassifications; i += 1) {
      const classification = shuffled.pop();
      if (classification === undefined) break;
      result.push(classification);
    }
    return result;
  }

  rollDurability(maxDurability: number): number {
    return randBetween(
      Math.floor(maxDurability * FOUND_ITEM_MIN_DURABILITY_MODIFIER),
      Math.floor(maxDurability * FOUND_ITEM_MAX_DURABILITY_MODIFIER),
      this.rngPolicy.equipmentGenerationDurability
    );
  }

  rollAffixes(
    template: EquipmentGenerationTemplate,
    itemLevel: number,
    equipmentType: EquipmentType,
    options?: { forcedMagical?: boolean; guaranteedAffixes?: GuaranteedAffixes }
  ): EquipmentAffixes {
    const affixes: EquipmentAffixes = {
      [AffixCategory.Prefix]: {},
      [AffixCategory.Suffix]: {},
    };

    let prefixCount: number;
    let suffixCount: number;

    if (options?.guaranteedAffixes !== undefined) {
      const drawnCategories = this.drawGuaranteedAffixCategories(options.guaranteedAffixes);
      prefixCount = drawnCategories.includes(AffixCategory.Prefix) ? 1 : 0;
      suffixCount = drawnCategories.includes(AffixCategory.Suffix) ? 1 : 0;
    } else {
      const isMagical =
        options?.forcedMagical ||
        this.rngPolicy.magicalDetermination.roll() < BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL ||
        equipmentType === EquipmentType.Amulet ||
        equipmentType === EquipmentType.Ring;
      if (!isMagical) {
        return affixes;
      }

      const roll = this.rngPolicy.affixSlotDistribution.roll();
      let hasPrefix = false;
      let hasSuffix = false;
      let hasBothAffixes = false;
      if (roll < CHANCE_TO_HAVE_DOUBLE_AFFIX) {
        hasBothAffixes = true;
      } else if (roll < CHANCE_TO_HAVE_PREFIX + CHANCE_TO_HAVE_DOUBLE_AFFIX) {
        hasPrefix = true;
      } else {
        hasSuffix = true;
      }

      prefixCount = hasPrefix || hasBothAffixes ? 1 : 0;
      suffixCount = hasSuffix || hasBothAffixes ? 1 : 0;
    }

    const prefixTypes = this.affixGenerator.getRandomValidPrefixTypes(template, prefixCount);
    const suffixTypes = this.affixGenerator.getRandomValidSuffixTypes(template, suffixCount);

    for (const prefixType of prefixTypes) {
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Prefix, prefixType },
        itemLevel,
        equipmentType
      );
      if (affixResult instanceof Error) {
        continue;
      }
      invariant(affixes[AffixCategory.Prefix] !== undefined);
      affixes[AffixCategory.Prefix][prefixType] = affixResult;
    }

    for (const suffixType of suffixTypes) {
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Suffix, suffixType },
        itemLevel,
        equipmentType
      );
      if (affixResult instanceof Error) {
        continue;
      }
      invariant(affixes[AffixCategory.Suffix] !== undefined);
      affixes[AffixCategory.Suffix][suffixType] = affixResult;
    }

    return affixes;
  }

  private drawGuaranteedAffixCategories(guaranteedAffixes: GuaranteedAffixes): AffixCategory[] {
    const pool = guaranteedAffixes.weightedCategories
      .filter((entry) => entry.weight > 0)
      .map((entry) => ({ ...entry }));
    const drawnCategories: AffixCategory[] = [];
    const slotCount = Math.min(guaranteedAffixes.slots, pool.length);

    for (let drawnCount = 0; drawnCount < slotCount; drawnCount += 1) {
      const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
      if (totalWeight <= 0) {
        break;
      }
      let roll = this.rngPolicy.guaranteedAffixCategoryDraw.roll() * totalWeight;
      let chosenIndex = pool.length - 1;
      for (let index = 0; index < pool.length; index += 1) {
        const entry = pool[index];
        invariant(entry !== undefined);
        roll -= entry.weight;
        if (roll < 0) {
          chosenIndex = index;
          break;
        }
      }
      const chosenEntry = pool[chosenIndex];
      invariant(chosenEntry !== undefined);
      drawnCategories.push(chosenEntry.affixCategory);
      pool.splice(chosenIndex, 1);
    }

    return drawnCategories;
  }

  rerollBaseProperties(equipment: Equipment) {
    const template = getEquipmentGenerationTemplate(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment
    );
    if (
      template instanceof ArmorGenerationTemplate ||
      template instanceof ShieldGenerationTemplate
    ) {
      const newAc = this.rollArmorClass(template.acRange);
      if (
        equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.HeadGear ||
        equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.BodyArmor ||
        equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
      ) {
        equipment.equipmentBaseItemProperties.armorClass = newAc;
      } else {
        throw new Error("unexpected equipment type tried to roll armor class");
      }
    }
    if (template instanceof WeaponGenerationTemplate) {
      const newClassifications = this.rollDamageClassifications(template);
      if (
        equipment.equipmentBaseItemProperties.equipmentType ===
          EquipmentType.OneHandedMeleeWeapon ||
        equipment.equipmentBaseItemProperties.equipmentType ===
          EquipmentType.TwoHandedMeleeWeapon ||
        equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon
      ) {
        equipment.equipmentBaseItemProperties.damageClassification = newClassifications;
      } else {
        throw new Error("unexpected equipment type tried to roll damage classifications");
      }
    }
  }

  rerollAffixValues(equipment: Equipment, template: EquipmentGenerationTemplate) {
    const multiplier = equipment.isTwoHanded() ? TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER : 1;

    for (const [prefixType, prefix] of equipment.iteratePrefixes()) {
      const affix = this.affixGenerator.rollAffix(
        { affixCategory: AffixCategory.Prefix, prefixType },
        prefix.tier,
        multiplier,
        template
      );
      equipment.insertOrReplaceAffix(AffixCategory.Prefix, prefixType, affix);
    }

    for (const [suffixType, suffix] of equipment.iterateSuffixes()) {
      const affix = this.affixGenerator.rollAffix(
        { affixCategory: AffixCategory.Suffix, suffixType },
        suffix.tier,
        multiplier,
        template
      );
      equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affix);
    }
  }
}
