import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  EquipmentSlotType,
  ERROR_MESSAGES,
  HoldableSlotType,
  invariant,
  TaggedEquipmentSlot,
  TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
} from "@speed-dungeon/common";

const MAIN_HAND: TaggedEquipmentSlot = {
  type: EquipmentSlotType.Holdable,
  slot: HoldableSlotType.MainHand,
};
const OFF_HAND: TaggedEquipmentSlot = {
  type: EquipmentSlotType.Holdable,
  slot: HoldableSlotType.OffHand,
};

export async function testItemManipulationBlockedInCombat(testFixture: IntegrationTestFixture) {
  // the first room of this dungeon is a monster lair, so the party starts in combat
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame([
    { name: "a", combatantClass: CombatantClass.Warrior },
  ]);

  const { clientApplication, gameClientHarness } = client;
  const { errorRecordService } = clientApplication;
  const party = clientApplication.gameContext.requireParty();
  invariant(party.isInCombat(), "expected the party to start this dungeon in combat");

  const warrior = party.combatantManager.requireCombatantByName("a");
  const { equipment, inventory } = warrior.combatantProperties;

  const swordOption = equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(swordOption !== undefined, "expected the warrior to start with a main hand weapon");
  const swordId = swordOption.getEntityId();

  const consumable = inventory.consumables[0];
  invariant(consumable !== undefined, "expected the warrior to start with an inventory consumable");
  const consumableId = consumable.getEntityId();

  await gameClientHarness.unequipSlot(warrior.getEntityId(), MAIN_HAND);
  expect(errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT
  );
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(swordId);

  errorRecordService.clear();
  await gameClientHarness.dropEquippedItem(warrior.getEntityId(), MAIN_HAND);
  expect(errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT
  );
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(swordId);
  expect(party.currentRoom.inventory.getItemById(swordId)).toBeInstanceOf(Error);

  errorRecordService.clear();
  await gameClientHarness.dropItem(consumableId);
  expect(errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT
  );
  expect(inventory.consumables.map((item) => item.getEntityId())).toEqual([consumableId]);
  expect(party.currentRoom.inventory.getItemById(consumableId)).toBeInstanceOf(Error);

  // dragging the main hand weapon onto the off hand slot (the offhand/mainhand swap) is a move
  errorRecordService.clear();
  await gameClientHarness.moveEquippedItemToSlot(warrior.getEntityId(), MAIN_HAND, OFF_HAND);
  expect(errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT
  );
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(swordId);
  expect(equipment.getEquipmentInSlot(OFF_HAND)).toBe(undefined);
}
