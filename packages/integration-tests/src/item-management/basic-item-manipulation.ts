import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  EquipmentSlotType,
  HoldableSlotType,
  invariant,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";

const MAIN_HAND: TaggedEquipmentSlot = {
  type: EquipmentSlotType.Holdable,
  slot: HoldableSlotType.MainHand,
};

// the default dungeon starts the party in an empty room, so these run out of combat
export async function testUnequipAndEquipInventoryItem(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const { errorRecordService } = clientApplication;
  const party = clientApplication.gameContext.requireParty();
  const warrior = party.combatantManager.requireCombatantByName("a");
  const { equipment, inventory } = warrior.combatantProperties;

  const swordOption = equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(swordOption !== undefined, "expected the warrior to start with a main hand weapon");
  const swordId = swordOption.getEntityId();

  await gameClientHarness.unequipSlot(warrior.getEntityId(), MAIN_HAND);
  expect(errorRecordService.getLastError()).toBeUndefined();
  expect(equipment.getEquipmentInSlot(MAIN_HAND)).toBe(undefined);
  expect(inventory.equipment.map((item) => item.getEntityId())).toEqual([swordId]);

  await gameClientHarness.equipInventoryItem(warrior.getEntityId(), swordId);
  expect(errorRecordService.getLastError()).toBeUndefined();
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(swordId);
  expect(inventory.equipment).toEqual([]);
}

export async function testDropEquippedItemToGround(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const { errorRecordService } = clientApplication;
  const party = clientApplication.gameContext.requireParty();
  const warrior = party.combatantManager.requireCombatantByName("a");
  const { equipment, inventory } = warrior.combatantProperties;

  const swordOption = equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(swordOption !== undefined, "expected the warrior to start with a main hand weapon");
  const swordId = swordOption.getEntityId();

  await gameClientHarness.dropEquippedItem(warrior.getEntityId(), MAIN_HAND);
  expect(errorRecordService.getLastError()).toBeUndefined();
  expect(equipment.getEquipmentInSlot(MAIN_HAND)).toBe(undefined);
  expect(inventory.equipment).toEqual([]);
  const droppedItem = party.currentRoom.inventory.getItemById(swordId);
  invariant(!(droppedItem instanceof Error), "expected the dropped item to be in the room");
  expect(droppedItem.getEntityId()).toBe(swordId);
}

export async function testDropAndPickUpInventoryItem(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const { errorRecordService } = clientApplication;
  const party = clientApplication.gameContext.requireParty();
  const warrior = party.combatantManager.requireCombatantByName("a");
  const { inventory } = warrior.combatantProperties;

  const consumable = inventory.consumables[0];
  invariant(consumable !== undefined, "expected the warrior to start with an inventory consumable");
  const consumableId = consumable.getEntityId();

  await gameClientHarness.dropItem(consumableId);
  expect(errorRecordService.getLastError()).toBeUndefined();
  expect(inventory.consumables).toEqual([]);
  const droppedItem = party.currentRoom.inventory.getItemById(consumableId);
  invariant(!(droppedItem instanceof Error), "expected the dropped item to be in the room");
  expect(droppedItem.getEntityId()).toBe(consumableId);

  await gameClientHarness.pickUpItem(consumableId);
  expect(errorRecordService.getLastError()).toBeUndefined();
  expect(inventory.consumables.map((item) => item.getEntityId())).toEqual([consumableId]);
  expect(party.currentRoom.inventory.getItemById(consumableId)).toBeInstanceOf(Error);
}
