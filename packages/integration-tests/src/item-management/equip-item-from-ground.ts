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

export async function testEquipItemFromGroundDisplacesOccupantToInventory(
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

  // the warrior fixture starts with a short sword in its main hand, so dropping it leaves a known
  // piece of equipment lying in the room for the rogue to equip
  const swordOption = warrior.combatantProperties.equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(swordOption !== undefined, "expected the warrior to start with a main hand weapon");
  const swordId = swordOption.getEntityId();
  await gameClientHarness.dropEquippedItem(warrior.getEntityId(), MAIN_HAND);

  const daggerOption = rogue.combatantProperties.equipment.getEquipmentInSlot(MAIN_HAND);
  invariant(daggerOption !== undefined, "expected the rogue to start with a main hand weapon");
  const daggerId = daggerOption.getEntityId();

  await gameClientHarness.equipItemFromGround(rogue.getEntityId(), swordId);

  const { equipment, inventory } = rogue.combatantProperties;
  expect(equipment.getEquipmentInSlot(MAIN_HAND)?.getEntityId()).toBe(swordId);
  expect(party.currentRoom.inventory.getItemById(swordId)).toBeInstanceOf(Error);
  expect(inventory.equipment.map((item) => item.getEntityId())).toEqual([daggerId]);
}
