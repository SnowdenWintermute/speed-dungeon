import {
  AISelectActionAndTarget,
  AdventuringParty,
  Battle,
  CombatAction,
  CombatActionType,
  Combatant,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getActionCommandPayloadsFromCombatActionUse } from "../character-uses-selected-combat-action-handler/get-action-command-payloads-from-combat-action-use.js";

export default async function getAIControlledTurnActionCommandPayloads(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatant: Combatant
) {
  const combatantId = combatant.entityProperties.id;

  if (party.battleId === null) return new Error(ERROR_MESSAGES.PARTY.NOT_IN_BATTLE);
  const battleOption = game.battles[party.battleId];
  if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);

  const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battleOption, combatantId);
  if (battleGroupsResult instanceof Error) return battleGroupsResult;
  const { allyGroup, enemyGroup } = battleGroupsResult;

  const aiSelectedActionAndTargetResult = AISelectActionAndTarget(
    game,
    combatantId,
    allyGroup,
    enemyGroup
  );
  if (aiSelectedActionAndTargetResult instanceof Error) return aiSelectedActionAndTargetResult;
  const { abilityName, target } = aiSelectedActionAndTargetResult;

  const selectedCombatAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName,
  };

  const payloadsResult = getActionCommandPayloadsFromCombatActionUse(
    game,
    combatantId,
    selectedCombatAction,
    target,
    battleOption,
    allyGroup.combatantIds
  );
  if (payloadsResult instanceof Error) return payloadsResult;
  const actionCommandPayloads = payloadsResult;

  return actionCommandPayloads;
}
