import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  EquipmentSlotType,
  HoldableSlotType,
  invariant,
  SHIELD_BEARING_CHARACTER_FIXTURES,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";

const MAIN_HAND: TaggedEquipmentSlot = {
  type: EquipmentSlotType.Holdable,
  slot: HoldableSlotType.MainHand,
};
const OFF_HAND: TaggedEquipmentSlot = {
  type: EquipmentSlotType.Holdable,
  slot: HoldableSlotType.OffHand,
};

export async function testMovingEquippedItemSwapsWithCompatibleOccupant(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
    { name: "b", combatantClass: CombatantClass.Rogue },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const party = clientApplication.gameContext.requireParty();
  const warrior = party.combatantManager.requireCombatantByName("a");
  const rogue = party.combatantManager.requireCombatantByName("b");

  // the rogue only starts with a main hand weapon, so take the warrior's one hander to fill both
  // of the rogue's hands with swappable weapons
  const stickOption = warrior.combatantProperties.equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(stickOption !== undefined, "expected the warrior to start with a main hand weapon");
  const stickId = stickOption.getEntityId();
  await gameClientHarness.dropEquippedItem(warrior.getEntityId(), MAIN_HAND);

  const knifeOption = rogue.combatantProperties.equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(knifeOption !== undefined, "expected the rogue to start with a main hand weapon");
  const knifeId = knifeOption.getEntityId();

  await gameClientHarness.equipItemFromGround(rogue.getEntityId(), stickId, true);

  await gameClientHarness.moveEquippedItemToSlot(rogue.getEntityId(), OFF_HAND, MAIN_HAND);

  const { equipment, inventory } = rogue.combatantProperties;
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(stickId);
  expect(equipment.getEquipmentInSlot(OFF_HAND)?.getEntityId()).toBe(knifeId);
  expect(inventory.equipment).toEqual([]);
}

export async function testMovingEquippedItemUnequipsIncompatibleOccupant(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(undefined, SHIELD_BEARING_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const party = clientApplication.gameContext.requireParty();
  const warrior = party.combatantManager.requireCombatantByName("a");

  const { equipment, inventory } = warrior.combatantProperties;
  const weaponOption = equipment.getEquipmentInSlot(MAIN_HAND);
  const shieldOption = equipment.getEquipmentInSlot(OFF_HAND);
  invariant(weaponOption !== undefined, "expected the warrior to start with a main hand weapon");
  invariant(shieldOption !== undefined, "expected the warrior to start with an offhand shield");
  const weaponId = weaponOption.getEntityId();
  const shieldId = shieldOption.getEntityId();

  // a shield can't go in the main hand, so it can't trade places with the weapon
  await gameClientHarness.moveEquippedItemToSlot(warrior.getEntityId(), MAIN_HAND, OFF_HAND);

  expect(equipment.getEquipmentInSlot(OFF_HAND)?.getEntityId()).toBe(weaponId);
  expect(equipment.getEquipmentInSlot(MAIN_HAND)).toBe(undefined);
  expect(inventory.equipment.map((item) => item.getEntityId())).toEqual([shieldId]);
}
