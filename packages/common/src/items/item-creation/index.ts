import { EntityName } from "../../aliases.js";
import { DEEPEST_FLOOR } from "../../app-consts.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { NumberRange } from "../../primatives/number-range.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { iterateNumericEnum } from "../../utils/index.js";
import { randBetween } from "../../utils/rand-between.js";
import { ConsumableType } from "../consumables/consumable-types.js";
import { Consumable, CONSUMABLE_TYPE_STRINGS } from "../consumables/index.js";
import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  EquipmentBaseItem,
  EquipmentType,
} from "../equipment/equipment-types/index.js";
import { Equipment } from "../equipment/index.js";
import { Item, ItemType } from "../index.js";
import { AffixGenerator } from "./builders/affix-generator/index.js";
import { ItemGenerationDirector } from "./builders/item-generation-director.js";
import { ItemGenerationBuilder } from "./builders/item.js";
import { instantiateItemGenerationBuildersAndDirectors } from "./instantiate-item-builders-and-directors.js";
import { ItemBuilder } from "./item-builder/index.js";

export class ItemGenerator {
  private itemGenerationDirectors: Record<EquipmentType, ItemGenerationDirector>;
  readonly itemGenerationBuilders: Record<EquipmentType, ItemGenerationBuilder>;

  constructor(
    private idGenerator: IdGenerator,
    private randomNumberGenerator: RandomNumberGenerator,
    public readonly affixGenerator: AffixGenerator
  ) {
    const { builders, directors } = instantiateItemGenerationBuildersAndDirectors(
      randomNumberGenerator,
      affixGenerator
    );

    this.itemGenerationDirectors = directors;
    this.itemGenerationBuilders = builders;
  }

  createConsumableByType(consumableType: ConsumableType) {
    return new Consumable(
      {
        name: CONSUMABLE_TYPE_STRINGS[consumableType] as EntityName,
        id: this.idGenerator.generate(),
      },
      1,
      {},
      consumableType,
      1
    );
  }

  generateTestItems(combatantProperties: CombatantProperties, num: number) {
    for (let i = 0; i < num; i += 1) {
      const iLvl = randBetween(1, DEEPEST_FLOOR, this.randomNumberGenerator);
      const randomItem = this.generateRandomItem(1);
      if (randomItem instanceof Error) return console.error(randomItem);
      combatantProperties.inventory.insertItem(randomItem);
    }
  }

  generateSpecificEquipmentType(
    equipmentBaseItem: EquipmentBaseItem,
    options: {
      noAffixes?: boolean;
      itemLevel?: number;
    }
  ) {
    const { noAffixes, itemLevel } = options;
    const itemGenerationDirector = this.itemGenerationDirectors[equipmentBaseItem.equipmentType];
    const item = itemGenerationDirector?.createItem(itemLevel || 1, this.idGenerator, {
      forcedBaseItemOption: {
        type: ItemType.Equipment,
        taggedBaseEquipment: equipmentBaseItem,
      },
      noAffixes,
    });

    if (!(item instanceof Equipment)) {
      throw new Error("invalid item type created");
    }

    return item;
  }

  generateOneOfEachItem(ilvlRange: NumberRange) {
    const items: Item[] = [];

    for (const [equipmentTypeString, baseItemEnum] of Object.entries(
      BASE_ITEMS_BY_EQUIPMENT_TYPE
    ).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
      const equipmentType = parseInt(equipmentTypeString) as EquipmentType;
      if (
        ![
          EquipmentType.BodyArmor,
          EquipmentType.Shield,
          EquipmentType.OneHandedMeleeWeapon,
          EquipmentType.TwoHandedMeleeWeapon,
          EquipmentType.TwoHandedRangedWeapon,
        ].includes(equipmentType)
      )
        continue;

      for (const baseItemString of iterateNumericEnum(baseItemEnum)) {
        const baseItem = parseInt(baseItemString);
        const ilvl = randBetween(ilvlRange.min, ilvlRange.max, this.randomNumberGenerator);
        const item = this.generateSpecificEquipmentType(
          {
            equipmentType: equipmentType,
            baseItemType: baseItem,
          },
          { itemLevel: ilvl }
        );
        if (item instanceof Error || item === undefined) {
          console.error("forced item type not generated:", item);
          continue;
        }
        items.push(item);
      }
    }
    return items;
  }

  generateRandomItem(itemLevel: number): Error | Item {
    const randomIndex = randBetween(
      0,
      Object.keys(this.itemGenerationDirectors).length - 1,
      this.randomNumberGenerator
    );
    const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[randomIndex];
    // const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[
    //   EquipmentType.OneHandedMeleeWeapon
    // ];
    if (randomItemGenerationDirector === undefined)
      return new Error("no director found for that item type");

    let attempts = 0;

    // it is possible for no valid item to be available in certain item level ranges
    // so try a few times to randomly get a valid one, else resort to an autoinjector
    let randomItemResult = randomItemGenerationDirector.createItem(itemLevel, this.idGenerator);

    const maxAttempts = 2;

    while (attempts < maxAttempts && randomItemResult instanceof Error) {
      randomItemResult = randomItemGenerationDirector.createItem(itemLevel, this.idGenerator);
      attempts += 1;
    }

    if (randomItemResult instanceof Error) {
      const message = `Couldn't find a valid item to generate, giving an autoinjector (${randomItemResult.message})`;
      console.info(message);
      const autoinjectorType =
        Math.random() > 0.3 ? ConsumableType.HpAutoinjector : ConsumableType.MpAutoinjector;

      return this.createConsumableByType(autoinjectorType);
    } else {
      return randomItemResult;
    }
  }

  generateLoot(quantity: number, maxItemLevel: number, rng: RandomNumberGenerator) {
    const equipment: Equipment[] = [];
    const consumables: Consumable[] = [];
    for (let i = 0; i < quantity; i += 1) {
      const floorNumber = maxItemLevel;
      const iLvl = randBetween(1, floorNumber, rng);
      const randomItem = this.generateRandomItem(iLvl);
      if (randomItem instanceof Error) console.error(randomItem);
      if (randomItem instanceof Consumable) consumables.push(randomItem);
      else if (randomItem instanceof Equipment) equipment.push(randomItem);
    }
    return { equipment, consumables };
  }
}
