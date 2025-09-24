import { CombatActionName, CombatActionTargetType } from "../index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { AIBehaviorContext } from "./ai-context.js";
import { RootAIBehaviorNode } from "./custom-nodes/root-ai-behavior-node.js";
import { ActionUserContext } from "../../combatant-context/action-user.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  user: Combatant
): Error | null | CombatActionExecutionIntent {
  const { combatantProperties: userCombatantProperties } = user;

  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, user.entityProperties.id);
  if (partyResult instanceof Error) return partyResult;
  const battleOption = SpeedDungeonGame.getBattleOption(game, partyResult.battleId) || null;

  const behaviorContext = new AIBehaviorContext(
    new ActionUserContext(game, partyResult, user),
    battleOption
  );

  const targetSelectorNode = new RootAIBehaviorNode(behaviorContext, user);

  const targetSelectionTreeSuccess = targetSelectorNode.execute();

  let actionExecutionIntentOption = behaviorContext.selectedActionIntent;
  if (actionExecutionIntentOption === null) {
    console.info("ai context did not have a selected actionExecutionIntent - passing turn");
    actionExecutionIntentOption = new CombatActionExecutionIntent(CombatActionName.PassTurn, 0, {
      type: CombatActionTargetType.Single,
      targetId: user.entityProperties.id,
    });
  }

  // must set their target because getAutoTarget may use it when creating action children or triggered actions
  // although I think this is already done by the behavior tree
  userCombatantProperties.targetingProperties.setSelectedTarget(
    actionExecutionIntentOption.targets
  );

  return actionExecutionIntentOption;
}
