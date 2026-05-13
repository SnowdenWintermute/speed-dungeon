import { EntityName } from "../../../aliases.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { Consumable, getSkillBookName, CONSUMABLE_TYPE_STRINGS } from "../../consumables/index.js";
import { ConsumableType } from "../../consumables/consumable-types.js";

export class ConsumableBuilder {
  private _itemLevel: number = 1;
  private _name: string | null = null;
  private _usesRemaining: number = 1;

  constructor(private consumableType: ConsumableType) {}

  itemLevel(level: number): this {
    this._itemLevel = level;
    return this;
  }

  name(name: string): this {
    this._name = name;
    return this;
  }

  usesRemaining(uses: number): this {
    this._usesRemaining = uses;
    return this;
  }

  private defaultName(): string {
    if (Consumable.isSkillBook(this.consumableType)) {
      return getSkillBookName(this.consumableType, this._itemLevel) as string;
    }
    if (this.consumableType === ConsumableType.StackOfShards) {
      return `${CONSUMABLE_TYPE_STRINGS[this.consumableType]} (${this._usesRemaining})`;
    }
    return CONSUMABLE_TYPE_STRINGS[this.consumableType];
  }

  build(idGenerator: IdGenerator): Consumable {
    const id = idGenerator.generate();
    const name = this._name ?? this.defaultName();

    return new Consumable(
      { id, name: name as EntityName },
      this._itemLevel,
      {},
      this.consumableType,
      this._usesRemaining,
    );
  }
}
