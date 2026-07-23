import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  testDropAndPickUpInventoryItem,
  testDropEquippedItemToGround,
  testUnequipAndEquipInventoryItem,
} from "./basic-item-manipulation";
import { testEquipItemFromGroundDisplacesOccupantToInventory } from "./equip-item-from-ground";
import { testItemManipulationBlockedInCombat } from "./item-manipulation-in-combat";
import {
  testMovingEquippedItemSwapsWithCompatibleOccupant,
  testMovingEquippedItemUnequipsIncompatibleOccupant,
} from "./move-equipped-item-to-slot";

describe("item management", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("unequips an item into the inventory and equips it back out again", async () => {
    await testUnequipAndEquipInventoryItem(testFixture);
  });

  it("drops an inventory item to the ground and picks it back up", async () => {
    await testDropAndPickUpInventoryItem(testFixture);
  });

  it("drops an equipped item straight to the ground", async () => {
    await testDropEquippedItemToGround(testFixture);
  });

  it("forbids item manipulation while the party is in combat", async () => {
    await testItemManipulationBlockedInCombat(testFixture);
  });

  it("equipping an item from the ground unequips the occupant into the inventory", async () => {
    await testEquipItemFromGroundDisplacesOccupantToInventory(testFixture);
  });

  it("moving an equipped item to a slot its occupant can also use swaps the two", async () => {
    await testMovingEquippedItemSwapsWithCompatibleOccupant(testFixture);
  });

  it("moving an equipped item unequips an occupant that can't use the vacated slot", async () => {
    await testMovingEquippedItemUnequipsIncompatibleOccupant(testFixture);
  });
});
