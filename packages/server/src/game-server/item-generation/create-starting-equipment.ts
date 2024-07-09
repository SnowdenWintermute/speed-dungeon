import {
  CombatantClass,
  EquipmentProperties,
  EquipmentSlot,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategoryType,
  IdGenerator,
  Item,
  ItemPropertiesType,
  MeleeOrRanged,
  NumberRange,
  PhysicalDamageType,
  TwoHandedMeleeWeapon,
  MaxAndCurrent,
} from "@speed-dungeon/common";
import { OneHandedMeleeWeapon } from "@speed-dungeon/common";

export default function createStartingEquipment(
  idGenerator: IdGenerator,
  combatantClass: CombatantClass
) {
  const startingEquipment: Partial<Record<EquipmentSlot, Item>> = {};

  let mainHandProperties, offhandProperties;
  switch (combatantClass) {
    case CombatantClass.Warrior:
      mainHandProperties = new EquipmentProperties(
        OneHandedMeleeWeapon.Stick,
        {
          type: EquipmentType.OneHandedMeleeWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource(
              {
                type: HpChangeSourceCategoryType.PhysicalDamage,
                meleeOrRanged: MeleeOrRanged.Melee,
              },
              PhysicalDamageType.Blunt
            ),
          ],
        },
        new MaxAndCurrent(1, 1)
      );
      break;
    case CombatantClass.Mage:
      mainHandProperties = new EquipmentProperties(
        TwoHandedMeleeWeapon.BoStaff,
        {
          type: EquipmentType.TwoHandedMeleeWeapon,
          damage: new NumberRange(2, 7),
          damageClassification: [
            new HpChangeSource(
              {
                type: HpChangeSourceCategoryType.PhysicalDamage,
                meleeOrRanged: MeleeOrRanged.Melee,
              },
              PhysicalDamageType.Blunt
            ),
          ],
        },
        new MaxAndCurrent(1, 1)
      );
      break;
    case CombatantClass.Rogue:
      mainHandProperties = offhandProperties = new EquipmentProperties(
        OneHandedMeleeWeapon.Dagger,
        {
          type: EquipmentType.OneHandedMeleeWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource(
              {
                type: HpChangeSourceCategoryType.PhysicalDamage,
                meleeOrRanged: MeleeOrRanged.Melee,
              },
              PhysicalDamageType.Slashing
            ),
          ],
        },
        new MaxAndCurrent(1, 1)
      );
      break;
  }

  const weaponName =
    combatantClass === CombatantClass.Warrior
      ? "Mud Soaked Stick"
      : combatantClass === CombatantClass.Mage
        ? "Rotting Branch"
        : "Butter Knife";

  const mhEntityProperties = {
    id: idGenerator.getNextEntityId(),
    name: weaponName,
  };
  const mhItem = new Item(
    mhEntityProperties,
    0,
    {},
    { type: ItemPropertiesType.Equipment, equipmentProperties: mainHandProperties }
  );
  startingEquipment[EquipmentSlot.MainHand] = mhItem;

  if (offhandProperties) {
    const ohEntityProperties = {
      id: idGenerator.getNextEntityId(),
      name: weaponName,
    };
    const ohItem = new Item(
      ohEntityProperties,
      0,
      {},
      { type: ItemPropertiesType.Equipment, equipmentProperties: mainHandProperties }
    );
    startingEquipment[EquipmentSlot.OffHand] = ohItem;
  }

  return startingEquipment;
}
