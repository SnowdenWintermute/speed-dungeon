// this script is run straight from source with node's type stripping, which cannot tell a type
// import from a value one — so the types have to say so
import {
  CombatantControllerType,
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  LootItemLevelType,
  LootItemSelectorType,
  MonsterType,
  WearableSlotType,
} from "@speed-dungeon/common";
import type {
  Combatant,
  EntityName,
  Equipment,
  LootGenerator,
  MonsterGenerator,
  MonsterRewardProfile,
} from "@speed-dungeon/common";

const WEARABLE_SLOT_EQUIPMENT_TYPES: Record<WearableSlotType, EquipmentType> = {
  [WearableSlotType.Head]: EquipmentType.HeadGear,
  [WearableSlotType.Body]: EquipmentType.BodyArmor,
  [WearableSlotType.RingL]: EquipmentType.Ring,
  [WearableSlotType.RingR]: EquipmentType.Ring,
  [WearableSlotType.Amulet]: EquipmentType.Amulet,
};

// the reserve hotswap slot gets a two-hander, so a character reads as having two real loadouts
// rather than the same weapon twice
const RESERVE_MAIN_HAND_TYPES = [
  EquipmentType.TwoHandedMeleeWeapon,
  EquipmentType.TwoHandedRangedWeapon,
];

const PET_MONSTER_TYPES = [
  MonsterType.Wolf,
  MonsterType.Spider,
  MonsterType.VampireBat,
  MonsterType.Slime,
];

const INVENTORY_SPARES = 4;

// how far either side of the character's level a piece of gear can have dropped
const ITEM_LEVEL_SPREAD = 2;

export class SeedCharacterLoadout {
  // fields declared rather than parameter properties: node's type stripping rejects those, and this
  // script runs straight from source
  private lootGenerator: LootGenerator;
  private monsterGenerator: MonsterGenerator;

  constructor(lootGenerator: LootGenerator, monsterGenerator: MonsterGenerator) {
    this.lootGenerator = lootGenerator;
    this.monsterGenerator = monsterGenerator;
  }

  // the character creation policy only grants starting gear, which makes every seeded character look
  // alike. this fills every slot from the game's own loot generator instead
  outfit(combatant: Combatant, characterIndex: number): void {
    const { combatantProperties } = combatant;
    const itemLevel = combatantProperties.classProgressionProperties.getMainClass().level;
    const { equipment, inventory } = combatantProperties;

    for (const [slot, equipmentType] of Object.entries(WEARABLE_SLOT_EQUIPMENT_TYPES)) {
      const wearableSlot = Number(slot) as WearableSlotType;
      const item = this.generateOfType(equipmentType, itemLevel);
      if (item === undefined) {
        continue;
      }
      equipment.putEquipmentInSlot(item, { type: EquipmentSlotType.Wearable, slot: wearableSlot });
    }

    this.fillActiveHotswapSlot(combatant, itemLevel);
    this.fillReserveHotswapSlot(combatant, itemLevel, characterIndex);

    for (let spare = 0; spare < INVENTORY_SPARES; spare += 1) {
      const item = this.generateOfType(undefined, itemLevel);
      if (item !== undefined) {
        inventory.equipment.push(item);
      }
    }
  }

  private fillActiveHotswapSlot(combatant: Combatant, itemLevel: number): void {
    const { equipment } = combatant.combatantProperties;

    const mainHand = this.generateOfType(EquipmentType.OneHandedMeleeWeapon, itemLevel);
    if (mainHand !== undefined) {
      equipment.putEquipmentInSlot(mainHand, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      });
    }

    const offHand = this.generateOfType(EquipmentType.Shield, itemLevel);
    if (offHand !== undefined) {
      equipment.putEquipmentInSlot(offHand, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.OffHand,
      });
    }
  }

  // putEquipmentInSlot only ever writes to the selected slot, so the reserve is filled directly
  private fillReserveHotswapSlot(
    combatant: Combatant,
    itemLevel: number,
    characterIndex: number
  ): void {
    const { equipment } = combatant.combatantProperties;
    const slots = equipment.getHoldableHotswapSlots();
    const reserveIndex = equipment.getSelectedHoldableSlotIndex() + 1;
    const reserve = slots[reserveIndex];
    if (reserve === undefined) {
      return;
    }

    const mainHandType = RESERVE_MAIN_HAND_TYPES[characterIndex % RESERVE_MAIN_HAND_TYPES.length];
    if (mainHandType === undefined) {
      return;
    }

    const twoHander = this.generateOfType(mainHandType, itemLevel);
    if (twoHander !== undefined) {
      reserve.holdables[HoldableSlotType.MainHand] = twoHander;
    }
  }

  buildPets(combatant: Combatant, characterIndex: number, petCount: number): Combatant[] {
    const { combatantProperties, entityProperties } = combatant;
    const level = combatantProperties.classProgressionProperties.getMainClass().level;
    const pets: Combatant[] = [];

    for (let index = 0; index < petCount; index += 1) {
      const monsterType =
        PET_MONSTER_TYPES[(characterIndex + index) % PET_MONSTER_TYPES.length];
      if (monsterType === undefined) {
        continue;
      }

      const pet = this.monsterGenerator.generate(monsterType, Math.max(1, level - 1));
      pet.combatantProperties.threatManager = undefined;
      const { controlledBy } = pet.combatantProperties;
      controlledBy.controllerType = CombatantControllerType.PlayerPetAI;
      controlledBy.controllerPlayerName =
        combatant.combatantProperties.controlledBy.controllerPlayerName;
      pet.entityProperties.name = `${entityProperties.name}'s pet` as EntityName;

      pets.push(pet);
    }

    return pets;
  }

  // the loot generator answers a consumable when no base item of the requested type exists at the
  // level, so a slot it cannot fill is left empty rather than filled with the wrong thing
  private generateOfType(
    equipmentType: undefined | EquipmentType,
    floorLevel: number
  ): undefined | Equipment {
    const profile: MonsterRewardProfile = {
      experience: 0,
      drops: [
        {
          chance: 1,
          quantity: { min: 1, max: 1 },
          // centered rather than exact: gear is picked up across the floors a character cleared, not
          // all at the depth they finished on, and item level drives the affix tier band
          itemLevel: { type: LootItemLevelType.CenteredOnFloor, spread: ITEM_LEVEL_SPREAD },
          selector: {
            type: LootItemSelectorType.Equipment,
            equipmentTypeWeights:
              equipmentType === undefined ? undefined : { [equipmentType]: 1 },
          },
        },
      ],
    };

    const { equipment } = this.lootGenerator.generateLootFromProfile(profile, floorLevel);
    return equipment[0];
  }
}
