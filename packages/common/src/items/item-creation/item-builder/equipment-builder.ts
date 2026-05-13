import cloneDeep from "lodash.clonedeep";
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
import { EquipmentRandomizer } from "./equipment-randomizer.js";
import { addAffixesToEquipmentName } from "./build-equipment-name.js";

export abstract class EquipmentBuilder {
  protected template: EquipmentGenerationTemplate;
  protected _itemLevel: number = 1;
  protected _name: string | null = null;
  protected _currentDurability: number | null = null;
  protected _indestructible: boolean = false;
  protected _affixes: EquipmentAffixes = {};

  constructor(
    protected baseEquipment: EquipmentBaseItem,
    protected randomizer: EquipmentRandomizer
  ) {
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

  indestructible() {
    this._indestructible = true;
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

  randomizeAffixes(): this {
    this._affixes = this.randomizer.rollAffixes(
      this.template,
      this._itemLevel,
      this.baseEquipment.equipmentType
    );
    return this;
  }

  randomizeBaseProperties(): this {
    return this;
  }

  randomizeDurability(): this {
    if (this.template.maxDurability !== null) {
      this._currentDurability = this.randomizer.rollDurability(this.template.maxDurability);
    }
    return this;
  }

  protected abstract buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties;

  protected abstract defaultName(): string;

  protected buildName(): string {
    const baseItemName = this.defaultName();
    return addAffixesToEquipmentName(baseItemName, this._affixes);
  }

  protected buildDurability(): null | { current: number; inherentMax: number } {
    if (this._indestructible) return null;
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

    equipment.affixes = cloneDeep(this._affixes);

    return equipment;
  }
}
