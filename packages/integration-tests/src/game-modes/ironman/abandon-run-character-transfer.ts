import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testCharacterTransferAfterAbandonedIronmanRun(
  testFixture: IntegrationTestFixture
) {
  // - create run with join order alpha:first, bravo:second, charlie:third
  // - players leave the game
  // - bravo's client sees a filled ironman run slot
  // - user bravo sends "abondon ironman run" client intent
  // - user bravo's client all ironman run slots empty/available
  //
  // - ironman run record shows their player no longer in the run
  // - ironman run record shows all characters owned by user alpha's player
  // - user alpha sends "abondon ironman run" client intent
  // - ironman run record shows all characters owned by user charlie's player
  // - user charlie sends "abondon ironman run" client intent
  // - run record no longer exists
  // - expect the party fate to be "Wiped" in the record
}
