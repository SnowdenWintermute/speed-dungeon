import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  EquipmentSlotId,
  invariant,
  SHIELD_BEARING_CHARACTER_FIXTURES,
} from "@speed-dungeon/common";

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
  const stickOption = warrior.combatantProperties.equipment.getEquipmentInSlot(
    EquipmentSlotId.MainHand
  );
  invariant(stickOption !== null, "expected the warrior to start with a main hand weapon");
  const stickId = stickOption.getEntityId();
  await gameClientHarness.dropEquippedItem(warrior.getEntityId(), EquipmentSlotId.MainHand);

  const knifeOption = rogue.combatantProperties.equipment.getEquipmentInSlot(
    EquipmentSlotId.MainHand
  );
  invariant(knifeOption !== null, "expected the rogue to start with a main hand weapon");
  const knifeId = knifeOption.getEntityId();

  await gameClientHarness.equipItemFromGround(rogue.getEntityId(), stickId, true);

  await gameClientHarness.moveEquippedItemToSlot(
    rogue.getEntityId(),
    EquipmentSlotId.OffHand,
    EquipmentSlotId.MainHand
  );

  const { equipment, inventory } = rogue.combatantProperties;
  expect(equipment.getEquipmentInSlot(EquipmentSlotId.MainHand)?.getEntityId()).toBe(stickId);
  expect(equipment.getEquipmentInSlot(EquipmentSlotId.OffHand)?.getEntityId()).toBe(knifeId);
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
  const weaponOption = equipment.getEquipmentInSlot(EquipmentSlotId.MainHand);
  const shieldOption = equipment.getEquipmentInSlot(EquipmentSlotId.OffHand);
  invariant(weaponOption !== null, "expected the warrior to start with a main hand weapon");
  invariant(shieldOption !== null, "expected the warrior to start with an offhand shield");
  const weaponId = weaponOption.getEntityId();
  const shieldId = shieldOption.getEntityId();

  // a shield can't go in the main hand, so it can't trade places with the weapon
  await gameClientHarness.moveEquippedItemToSlot(
    warrior.getEntityId(),
    EquipmentSlotId.MainHand,
    EquipmentSlotId.OffHand
  );

  expect(equipment.getEquipmentInSlot(EquipmentSlotId.OffHand)?.getEntityId()).toBe(weaponId);
  expect(equipment.getEquipmentInSlot(EquipmentSlotId.MainHand)).toBe(undefined);
  expect(inventory.equipment.map((item) => item.getEntityId())).toEqual([shieldId]);
}
