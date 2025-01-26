import { CombatActionName, CombatActionTargetType } from "../index.js";
import { BattleGroup } from "../../battle/index.js";
import { Combatant } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { chooseRandomFromArray } from "../../utils/index.js";
import { AIBehaviorContext } from "./ai-context.js";
import { SetAvailableTargetsAndUsableActions } from "./custom-nodes/set-available-targets-and-usable-actions.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  userId: string,
  allyBattleGroup: BattleGroup,
  enemyBattleGroup: BattleGroup
): Error | CombatActionExecutionIntent {
  const randomEnemyTargetResult = getRandomAliveEnemy(game, enemyBattleGroup);
  if (randomEnemyTargetResult instanceof Error) return randomEnemyTargetResult;
  const randomEnemyTarget = randomEnemyTargetResult;

  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;

  /// TESTING AI CONTEXT
  const partyResult = SpeedDungeonGame.getPartyOfCombatant(
    game,
    userCombatantResult.entityProperties.id
  );
  if (partyResult instanceof Error) return partyResult;
  const battleOption = SpeedDungeonGame.getBattleOption(game, partyResult.battleId) || null;
  const aiContext = new AIBehaviorContext(userCombatantResult, game, partyResult, battleOption);
  const targetSelector = new SetAvailableTargetsAndUsableActions(
    aiContext,
    () => true,
    () => true,
    () => 1
  );
  const targetSelectionTreeSuccess = targetSelector.execute();
  console.log("targetSelectionTreeSuccess:", targetSelectionTreeSuccess);

  console.log(
    JSON.stringify(
      {
        consideredTargetCombatants: aiContext.consideredTargetCombatants.map(
          (combatant) => combatant.entityProperties
        ),
        consideredPairs: aiContext.consideredActionTargetPairs,
      },
      null,
      2
    )
  );

  /// TESTING AI CONTEXT DONE

  // @TODO - use a behavior tree instead of this !!!INVALID!!! return statement
  const actionExecutionIntent = new CombatActionExecutionIntent(CombatActionName.Attack, {
    type: CombatActionTargetType.All,
  });
  return actionExecutionIntent;
}

function getRandomAliveEnemy(
  game: SpeedDungeonGame,
  enemyBattleGroup: BattleGroup
): Error | Combatant {
  const idsOfAliveTargets = [];
  for (const enemyId of enemyBattleGroup.combatantIds) {
    let combatantResult = SpeedDungeonGame.getCombatantById(game, enemyId);
    if (combatantResult instanceof Error) return combatantResult;
    if (combatantResult.combatantProperties.hitPoints > 0) idsOfAliveTargets.push(enemyId);
  }
  if (idsOfAliveTargets.length === 0) return new Error("No alive targets");
  const randomTargetIdResult = chooseRandomFromArray(idsOfAliveTargets);
  if (randomTargetIdResult instanceof Error) return randomTargetIdResult;

  return SpeedDungeonGame.getCombatantById(game, randomTargetIdResult);
}
