import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  AdventuringParty,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  invariant,
  SpeedDungeonGame,
  TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA,
} from "@speed-dungeon/common";

function logClientTurnOrder(party: AdventuringParty, game: SpeedDungeonGame, label: string) {
  const battleOption = party.getBattleOption(game);
  if (!battleOption) {
    console.log(`[CLIENT TURN ORDER - ${label}] no battle`);
    return;
  }
  battleOption.turnOrderManager.updateTrackers(game, party);
  const trackers = battleOption.turnOrderManager.getTrackers();
  const schedulers = battleOption.turnOrderManager.turnSchedulerManager;
  console.log(`[CLIENT TURN ORDER - ${label}]`);
  for (let i = 0; i < Math.min(6, trackers.length); i++) {
    const t = trackers[i];
    invariant(t !== undefined);
    const tagged = t.getTaggedIdOfTrackedEntity();
    const entityId = t.getEntityId();
    const combatant = party.combatantManager.getCombatantOption(entityId);
    const name = combatant?.getName?.() || entityId;
    const isPlayerControlled =
      combatant?.combatantProperties?.controlledBy?.isPlayerControlled?.() ?? "N/A";
    console.log(
      `  [${i}] ${name} (${entityId}) timeOfNextMove=${t.timeOfNextMove} type=${tagged.type} isPlayerControlled=${isPlayerControlled}`
    );
  }
}

export async function testDismissPetRemovesWeb(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();

  const { combatantManager } = party;

  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);

  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(1);

  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  logClientTurnOrder(party, game, "after SummonPetParent");

  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  logClientTurnOrder(party, game, "after PassTurn 1");

  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  logClientTurnOrder(party, game, "after PassTurn 2");

  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  logClientTurnOrder(party, game, "after PassTurn 3");
}
