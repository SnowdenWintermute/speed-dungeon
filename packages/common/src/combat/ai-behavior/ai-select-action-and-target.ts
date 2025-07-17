import { CombatActionName, CombatActionTarget, CombatActionTargetType } from "../index.js";
import { BattleGroup } from "../../battle/index.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { chooseRandomFromArray } from "../../utils/index.js";
import { AIBehaviorContext } from "./ai-context.js";
import { SetAvailableTargetsAndUsableActions } from "./custom-nodes/set-available-targets-and-usable-actions.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { AllyAndEnemyBattleGroups } from "../../battle/get-ally-and-enemy-battle-groups.js";

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  user: Combatant,
  battleGroups: AllyAndEnemyBattleGroups
): Error | null | CombatActionExecutionIntent {
  const { allyGroup, enemyGroup } = battleGroups;

  const { combatantProperties: userCombatantProperties } = user;

  /// TESTING AI CONTEXT
  // const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, user.entityProperties.id);
  // if (partyResult instanceof Error) return partyResult;
  // const battleOption = SpeedDungeonGame.getBattleOption(game, partyResult.battleId) || null;
  // const aiContext = new AIBehaviorContext(user, game, partyResult, battleOption);
  // const targetSelector = new SetAvailableTargetsAndUsableActions(
  //   aiContext,
  //   () => true,
  //   () => true,
  //   () => 1
  // );
  // const targetSelectionTreeSuccess = targetSelector.execute();

  /// TESTING AI CONTEXT DONE
  const randomTarget = getRandomAliveEnemy(game, enemyGroup);
  if (randomTarget instanceof Error) {
    throw randomTarget;
  }
  if (randomTarget === null) return null;

  // @TODO - use a behavior tree instead
  const combatActionTarget: CombatActionTarget = {
    type: CombatActionTargetType.Single,
    targetId: randomTarget.entityProperties.id,
  };
  const actionExecutionIntent = new CombatActionExecutionIntent(
    CombatActionName.Attack,
    combatActionTarget
  );
  userCombatantProperties.combatActionTarget = combatActionTarget; // must set their target because getAutoTarget may use it

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
    if (!CombatantProperties.isDead(combatantResult.combatantProperties))
      idsOfAliveTargets.push(enemyId);
  }
  if (idsOfAliveTargets.length === 0) {
    throw new Error("no alive targets found in getRandomAliveEnemy");
  }
  const randomTargetIdResult = chooseRandomFromArray(idsOfAliveTargets);
  if (randomTargetIdResult instanceof Error) return randomTargetIdResult;

  return SpeedDungeonGame.getCombatantById(game, randomTargetIdResult);
}
