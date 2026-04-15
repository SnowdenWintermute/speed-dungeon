import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { AIBehaviorContext } from "./ai-context.js";
import { RootAIBehaviorNode } from "./custom-nodes/root-ai-behavior-node.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatActionName } from "../combat-actions/combat-action-names.js";
import { CombatActionTargetType } from "../targeting/combat-action-targets.js";
import { ActionRank } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  user: Combatant,
  randomNumberGenerationPolicy: RandomNumberGenerationPolicy
): null | CombatActionExecutionIntent {
  const { combatantProperties: userCombatantProperties } = user;
  // console.info("AISelectActionAndTarget:", user.getEntityId(), user.getName());

  const partyResult = game.getPartyOptionOfCombatant(user.entityProperties.id);
  if (partyResult === undefined) {
    throw new Error(ERROR_MESSAGES.PARTY.CHARACTER_NOT_FOUND);
  }
  const battleOption = game.getBattleOption(partyResult.battleId) || null;

  const behaviorContext = new AIBehaviorContext(
    new ActionUserContext(game, partyResult, user),
    randomNumberGenerationPolicy,
    battleOption
  );

  const targetSelectorNode = new RootAIBehaviorNode(behaviorContext);

  const targetSelectionTreeSuccess = targetSelectorNode.execute();

  let actionExecutionIntentOption = behaviorContext.selectedActionIntent;
  if (actionExecutionIntentOption === null) {
    console.info("ai context did not have a selected actionExecutionIntent - passing turn");
    actionExecutionIntentOption = new CombatActionExecutionIntent(
      CombatActionName.PassTurn,
      0 as ActionRank,
      {
        type: CombatActionTargetType.Single,
        targetId: user.entityProperties.id,
      }
    );
  }

  // must set their target because getAutoTarget may use it when creating action children or triggered actions
  // although I think this is already done by the behavior tree
  userCombatantProperties.targetingProperties.setSelectedTarget(
    actionExecutionIntentOption.targets
  );

  return actionExecutionIntentOption;
}
