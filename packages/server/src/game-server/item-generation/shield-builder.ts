// import {
//   Affixes,
//   BaseItem,
//   ERROR_MESSAGES,
//   EquipmentBaseItem,
//   EquipmentType,
//   ItemPropertiesType,
//   Shield,
//   ShieldProperties,
//   ShieldSize,
// } from "@speed-dungeon/common";
// import { ItemGenerationBuilder, ItemNamer, TaggedBaseItem } from "./item-generation-builder";

// class ShieldBuilder extends ItemNamer implements ItemGenerationBuilder {
//   constructor(public itemLevel: number) {
//     super();
//   }
//   buildBaseItem: () => TaggedBaseItem = function () {
//     // select random shield base from those available for this.itemLevel
//     return {
//       type: ItemPropertiesType.Equipment,
//       baseItem: { equipmentType: EquipmentType.Shield, baseEquipmentItem: Shield.Aspis },
//     };
//   };
//   buildEquipmentBaseItemProperties(baseEquipmentItem: EquipmentBaseItem) {
//     if (!(baseEquipmentItem in Shield)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

//     // look up armor class range for the base item and roll it

//     const properties: ShieldProperties = {
//       type: EquipmentType.Shield,
//       baseItem: baseEquipmentItem as Shield,
//       size: ShieldSize.Medium,
//       armorClass: 122,
//     };
//     return properties;
//   }
//   buildDurability(baseItem: BaseItem) {
//     // look up durability for the base item and roll the current durability
//     return { max: 100, current: 50 };
//   }
//   buildAffixes(baseItem: BaseItem) {
//     // roll rarity
//     // roll number of prefixes/suffixes
//     // look up valid affixes and their tier levels for shields
//     // modify list of valid affixes with any special adjustments for the particular base item (certain base items may allow
//     // different affixes/tiers than the general base item type)
//     const affixes: Affixes = { prefixes: [], suffixes: [] };
//     return affixes;
//   }
//   buildRequirements(baseItem: BaseItem, affixes: Affixes | null) {
//     // look up requirements based on the base item
//     // adjust requirements if any affix has an affect on them
//     return {};
//   }
// }
