import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testEquipItemFromGroundDisplacesOccupantToInventory } from "./equip-item-from-ground";
import {
  testMovingEquippedItemSwapsWithCompatibleOccupant,
  testMovingEquippedItemUnequipsIncompatibleOccupant,
} from "./move-equipped-item-to-slot";

describe("item management", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
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
