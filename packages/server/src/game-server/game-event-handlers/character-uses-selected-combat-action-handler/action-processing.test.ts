import { jest } from "@jest/globals";
import {
  COMBAT_ACTIONS,
  CombatActionName,
  CombatActionTargetType,
  IdGenerator,
} from "@speed-dungeon/common";
import { processCombatAction } from "./sequential-action-execution-manager";
import { setUpTestGameWithPartyInBattle } from "../../utils/testing";

describe("action processing", () => {
  const testId = Date.now().toString();
  const realDateNow = Date.now.bind(global.Date);
  const idGenerator = new IdGenerator();

  beforeAll(async () => {
    //
  });

  beforeEach(async () => {
    global.Date.now = realDateNow;

    // set up a game with a party in a battle
  });

  afterAll(async () => {
    //
  });

  it("correctly records a game record when both players disconnect at the start of a game", (done) => {
    setTimeout(() => done(), 2000);

    const combatantContext = setUpTestGameWithPartyInBattle(idGenerator);
    const { game, party, combatant } = combatantContext;
    const combatants = Object.values(party.characters).concat(
      Object.values(party.currentRoom.monsters)
    );
    const combatantPositions = combatants.map((combatant) => [
      combatant.entityProperties.name,
      combatant.combatantProperties.position,
    ]);

    const opponents = combatantContext.getOpponents();
    const firstOpponentOption = opponents[0];
    if (!firstOpponentOption) throw new Error("no targets");

    combatant.combatantProperties.combatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: firstOpponentOption.entityProperties.id,
    };
    // console.log(JSON.stringify(combatantPositions, null, 2));

    const result = processCombatAction(
      COMBAT_ACTIONS[CombatActionName.ChainingSplitArrowParent],
      combatantContext
    );
  });
});
