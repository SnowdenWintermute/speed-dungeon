import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { EntityName } from "../../../aliases.js";
import { Equipment } from "../../equipment/index.js";
import {
  Affix,
  AffixCategory,
  EquipmentAffixes,
  PrefixType,
  SuffixType,
} from "../../equipment/affixes.js";
import { EquipmentBaseItem } from "../../equipment/equipment-types/index.js";
import { EquipmentBaseItemProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentGenerationTemplate } from "../equipment-templates/base-templates.js";
import { getEquipmentGenerationTemplate } from "../equipment-templates/index.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { getPrefixName } from "../builders/item-namer/get-prefix-name.js";
import { getSuffixName } from "../builders/item-namer/get-suffix-name.js";

export abstract class EquipmentBuilder {
  protected template: EquipmentGenerationTemplate;
  protected _itemLevel: number = 1;
  protected _name: string | null = null;
  protected _currentDurability: number | null = null;
  protected _affixes: EquipmentAffixes = {};

  constructor(protected baseEquipment: EquipmentBaseItem) {
    this.template = getEquipmentGenerationTemplate(baseEquipment);
  }

  itemLevel(level: number): this {
    this._itemLevel = level;
    return this;
  }

  name(name: string): this {
    this._name = name;
    return this;
  }

  durability(current: number): this {
    this._currentDurability = current;
    return this;
  }

  prefix(prefixType: PrefixType, affix: Affix): this {
    if (!this._affixes[AffixCategory.Prefix]) {
      this._affixes[AffixCategory.Prefix] = {};
    }
    this._affixes[AffixCategory.Prefix][prefixType] = affix;
    return this;
  }

  suffix(suffixType: SuffixType, affix: Affix): this {
    if (!this._affixes[AffixCategory.Suffix]) {
      this._affixes[AffixCategory.Suffix] = {};
    }
    this._affixes[AffixCategory.Suffix][suffixType] = affix;
    return this;
  }

  protected abstract buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties;

  protected abstract defaultName(): string;

  protected buildName(): string {
    const baseItemName = this.defaultName();
    const prefixNames: string[] = [];
    const suffixNames: string[] = [];

    const prefixes = this._affixes[AffixCategory.Prefix] as
      | Partial<Record<PrefixType, Affix>>
      | undefined;
    if (prefixes) {
      for (const [prefixType, affix] of iterateNumericEnumKeyedRecord(prefixes)) {
        prefixNames.push(getPrefixName(prefixType, affix.tier));
      }
    }

    const suffixes = this._affixes[AffixCategory.Suffix] as
      | Partial<Record<SuffixType, Affix>>
      | undefined;
    if (suffixes) {
      for (const [suffixType, affix] of iterateNumericEnumKeyedRecord(suffixes)) {
        suffixNames.push(getSuffixName(suffixType, affix.tier));
      }
    }

    const prefix = prefixNames[0] ? prefixNames[0] + " " : "";
    const suffix = suffixNames[0] ? " of " + suffixNames[0] : "";

    return prefix + baseItemName + suffix;
  }

  protected buildDurability(): null | { current: number; inherentMax: number } {
    if (this.template.maxDurability === null) return null;
    const current = this._currentDurability ?? this.template.maxDurability;
    return { current, inherentMax: this.template.maxDurability };
  }

  build(idGenerator: IdGenerator): Equipment {
    const id = idGenerator.generate();
    const name = this._name ?? this.buildName();

    const equipment = new Equipment(
      { id, name: name as EntityName },
      this._itemLevel,
      this.template.requirements,
      this.buildEquipmentBaseItemProperties(),
      this.buildDurability()
    );

    equipment.affixes = this._affixes;

    return equipment;
  }
}
