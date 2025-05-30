import { jest } from "@jest/globals";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTarget,
  CombatActionTargetType,
  IdGenerator,
  Replayer,
} from "@speed-dungeon/common";
import { processCombatAction } from "./process-combat-action.js";
import { setUpTestGameWithPartyInBattle } from "../../utils/testing/index.js";

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

    const targets: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: firstOpponentOption.entityProperties.id,
    };
    combatant.combatantProperties.combatActionTarget = targets;
    // console.log(JSON.stringify(combatantPositions, null, 2));

    const result = processCombatAction(
      new CombatActionExecutionIntent(CombatActionName.ChainingSplitArrowParent, targets),
      combatantContext
    );
    // Replayer.printReplayTree(result);
  });
});
