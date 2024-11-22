import {
  CombatantClass,
  EquipmentProperties,
  EquipmentSlot,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategoryType,
  Item,
  ItemPropertiesType,
  MaxAndCurrent,
  MeleeOrRanged,
  NumberRange,
  OneHandedMeleeWeapon,
  PhysicalDamageType,
  Shield,
  ShieldSize,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";

export default function createStartingEquipment(combatantClass: CombatantClass) {
  const startingEquipment: Partial<Record<EquipmentSlot, Item>> = {};

  let mainHandProperties, offhandProperties;
  switch (combatantClass) {
    case CombatantClass.Warrior:
      mainHandProperties = new EquipmentProperties(
        {
          type: EquipmentType.OneHandedMeleeWeapon,
          baseItem: OneHandedMeleeWeapon.Stick,
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
      offhandProperties = new EquipmentProperties(
        {
          type: EquipmentType.Shield,
          baseItem: Shield.MakeshiftBuckler,
          armorClass: 2,
          size: ShieldSize.Small,
        },
        new MaxAndCurrent(1, 1)
      );
      break;
    case CombatantClass.Mage:
      mainHandProperties = new EquipmentProperties(
        {
          type: EquipmentType.TwoHandedMeleeWeapon,
          baseItem: TwoHandedMeleeWeapon.BoStaff,
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
      mainHandProperties = new EquipmentProperties(
        {
          type: EquipmentType.TwoHandedRangedWeapon,
          baseItem: TwoHandedRangedWeapon.ShortBow,
          damage: new NumberRange(1, 4),
          damageClassification: [
            new HpChangeSource(
              {
                type: HpChangeSourceCategoryType.PhysicalDamage,
                meleeOrRanged: MeleeOrRanged.Ranged,
              },
              PhysicalDamageType.Piercing
            ),
          ],
        },
        new MaxAndCurrent(1, 1)
      );
      // mainHandProperties = offhandProperties = new EquipmentProperties(
      //   {
      //     type: EquipmentType.OneHandedMeleeWeapon,
      //     baseItem: OneHandedMeleeWeapon.Dagger,
      //     damage: new NumberRange(1, 2),
      //     damageClassification: [
      //       new HpChangeSource(
      //         {
      //           type: HpChangeSourceCategoryType.PhysicalDamage,
      //           meleeOrRanged: MeleeOrRanged.Melee,
      //         },
      //         PhysicalDamageType.Slashing
      //       ),
      //     ],
      //   },
      //   new MaxAndCurrent(1, 1)
      // );
      break;
  }

  const weaponName =
    combatantClass === CombatantClass.Warrior
      ? "Mud Soaked Stick"
      : combatantClass === CombatantClass.Mage
        ? "Rotting Branch"
        : "Butter Knife";
  const ohName = combatantClass === CombatantClass.Warrior ? "Pot Lid" : weaponName;

  const mhEntityProperties = {
    id: idGenerator.generate(),
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
      id: idGenerator.generate(),
      name: ohName,
    };
    const ohItem = new Item(
      ohEntityProperties,
      0,
      {},
      { type: ItemPropertiesType.Equipment, equipmentProperties: offhandProperties }
    );
    startingEquipment[EquipmentSlot.OffHand] = ohItem;
  }

  return startingEquipment;
}
