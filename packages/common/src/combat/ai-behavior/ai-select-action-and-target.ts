import { CombatActionIntent } from "../index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { AIBehaviorContext } from "./ai-context.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { SelectRandomActionAndTargets } from "./custom-nodes/select-random-action-and-targets.js";
import { BEHAVIOR_NODE_STATE_STRINGS } from "./behavior-tree.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  user: Combatant
): Error | null | CombatActionExecutionIntent {
  const { combatantProperties: userCombatantProperties } = user;

  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, user.entityProperties.id);
  if (partyResult instanceof Error) return partyResult;
  const battleOption = SpeedDungeonGame.getBattleOption(game, partyResult.battleId) || null;

  const behaviorContext = new AIBehaviorContext(
    new CombatantContext(game, partyResult, user),
    battleOption
  );

  const targetSelectorNode = new SelectRandomActionAndTargets(behaviorContext, user, [
    CombatActionIntent.Malicious,
  ]);

  const targetSelectionTreeSuccess = targetSelectorNode.execute();
  console.log("behavior tree result:", BEHAVIOR_NODE_STATE_STRINGS[targetSelectionTreeSuccess]);
  console.log(
    "combat action intent selected from behavior tree:",
    behaviorContext.selectedActionIntent
  );

  const actionExecutionIntentOption = behaviorContext.selectedActionIntent;
  if (actionExecutionIntentOption === null)
    throw new Error("unhandled case - ai context did not have a selected actionExecutionIntent");

  // must set their target because getAutoTarget may use it when creating action children or triggered actions
  // although I think this is already done by the behavior tree
  userCombatantProperties.combatActionTarget = actionExecutionIntentOption.targets;

  return actionExecutionIntentOption;
}
