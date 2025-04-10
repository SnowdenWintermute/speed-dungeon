import {
  AISelectActionAndTarget,
  AdventuringParty,
  Battle,
  Combatant,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export async function getAIControlledTurnActionCommandPayloads(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatant: Combatant
) {
  // const combatantId = combatant.entityProperties.id;

  // if (party.battleId === null) return new Error(ERROR_MESSAGES.PARTY.NOT_IN_BATTLE);
  // const battleOption = game.battles[party.battleId];
  // if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);

  // const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battleOption, combatantId);
  // if (battleGroupsResult instanceof Error) return battleGroupsResult;
  // const { allyGroup, enemyGroup } = battleGroupsResult;

  // // create the ai context for this combatant
  // // run it through the behavior tree
  // // attempt to accesss their target and ability selection
  // // if is null, end their turn

  // const aiSelectedActionAndTargetResult = AISelectActionAndTarget(
  //   game,
  //   combatantId,
  //   battleGroupsResult
  // );
  // if (aiSelectedActionAndTargetResult instanceof Error) return aiSelectedActionAndTargetResult;
  // // const { abilityName, target } = aiSelectedActionAndTargetResult;

  // // @TODO - this function was removed
  // // const payloadsResult = getActionCommandPayloadsFromCombatActionUse(
  // //   game,
  // //   combatantId,
  // //   selectedCombatAction,
  // //   target,
  // //   battleOption,
  // //   allyGroup.combatantIds
  // // );
  // // if (payloadsResult instanceof Error) return payloadsResult;
  // // const actionCommandPayloads = payloadsResult;

  return [];
}
