import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testEquipItemFromGroundDisplacesOccupantToInventory } from "./equip-item-from-ground";

describe("item management", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("equipping an item from the ground unequips the occupant into the inventory", async () => {
    await testEquipItemFromGroundDisplacesOccupantToInventory(testFixture);
  });
});
