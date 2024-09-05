import {
  AISelectActionAndTarget,
  AdventuringParty,
  Battle,
  CombatAction,
  CombatActionType,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../..";

export default function takeAiControlledTurnIfActive(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatantId: string
) {
  let activeCombatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
  if (activeCombatantResult instanceof Error) return activeCombatantResult;
  let { combatantProperties } = activeCombatantResult;
  const activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
  if (!activeCombatantIsAiControlled) return;
  console.log("active combatant is ai controlled: ", combatantId);

  if (party.battleId === null) return new Error(ERROR_MESSAGES.PARTY.NOT_IN_BATTLE);
  const battleOption = game.battles[party.battleId];
  if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);

  console.log("current battle id for ai combatant: ", battleOption.id);

  const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battleOption, combatantId);
  if (battleGroupsResult instanceof Error) return battleGroupsResult;
  const { allyGroup, enemyGroup } = battleGroupsResult;

  console.log("battle groups: ", allyGroup, enemyGroup);

  const aiSelectedActionAndTargetResult = AISelectActionAndTarget(
    game,
    combatantId,
    allyGroup,
    enemyGroup
  );
  if (aiSelectedActionAndTargetResult instanceof Error) return aiSelectedActionAndTargetResult;
  const { abilityName, target } = aiSelectedActionAndTargetResult;

  console.log("selected target and ability: ", abilityName, target);

  const selectedCombatAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName,
  };

  return this.processSelectedCombatAction(
    game,
    party,
    combatantId,
    selectedCombatAction,
    target,
    battleOption,
    party.characterPositions
  );
}
