import { CombatActionIntent } from "../index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { AllyAndEnemyBattleGroups } from "../../battle/get-ally-and-enemy-battle-groups.js";
import { AIBehaviorContext } from "./ai-context.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { SelectRandomActionAndTargets } from "./custom-nodes/select-random-action-and-targets.js";
import { BEHAVIOR_NODE_STATE_STRINGS } from "./behavior-tree.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  user: Combatant
): Error | null | CombatActionExecutionIntent {
  const { combatantProperties: userCombatantProperties } = user;

  /// TESTING AI CONTEXT
  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, user.entityProperties.id);
  if (partyResult instanceof Error) return partyResult;
  const battleOption = SpeedDungeonGame.getBattleOption(game, partyResult.battleId) || null;
  const aiContext = new AIBehaviorContext(
    new CombatantContext(game, partyResult, user),
    battleOption
  );

  const targetSelectorNode = new SelectRandomActionAndTargets(aiContext, user, [
    CombatActionIntent.Malicious,
  ]);

  const targetSelectionTreeSuccess = targetSelectorNode.execute();
  console.log("behavior tree result:", BEHAVIOR_NODE_STATE_STRINGS[targetSelectionTreeSuccess]);
  console.log("combat action intent selected from behavior tree:", aiContext.selectedActionIntent);

  const actionExecutionIntentOption = aiContext.selectedActionIntent;
  if (actionExecutionIntentOption === null)
    throw new Error("unhandled case - ai context did not have a selected actionExecutionIntent");
  userCombatantProperties.combatActionTarget = actionExecutionIntentOption.targets; // must set their target because getAutoTarget may use it

  return actionExecutionIntentOption;
}
