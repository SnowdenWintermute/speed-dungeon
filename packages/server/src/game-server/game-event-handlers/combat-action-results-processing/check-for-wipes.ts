import { Battle, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import checkForDefeatedCombatantGroups from "./check-for-defeated-combatant-groups";

export default function checkForWipes(
  game: SpeedDungeonGame,
  combatantId: string,
  battleIdOption: null | string
):
  | Error
  | {
      alliesDefeated: boolean;
      opponentsDefeated: boolean;
    } {
  // IF NOT IN BATTLE AND SOMEHOW WIPED OWN PARTY
  if (battleIdOption === null) {
    const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, combatantId);
    if (partyResult instanceof Error) return partyResult;
    const alliesDefeatedResult = SpeedDungeonGame.allCombatantsInGroupAreDead(
      game,
      partyResult.characterPositions
    );
    if (alliesDefeatedResult instanceof Error) return alliesDefeatedResult;
    return {
      alliesDefeated: alliesDefeatedResult,
      opponentsDefeated: false,
    };
  }

  // MORE LIKELY, IN BATTLE
  const battleOption = game.battles[battleIdOption];
  if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);

  const battleGroupResult = Battle.getAllyAndEnemyBattleGroups(battleOption, combatantId);
  if (battleGroupResult instanceof Error) return battleGroupResult;
  const { allyGroup, enemyGroup } = battleGroupResult;
  const partyWipesResult = checkForDefeatedCombatantGroups(
    game,
    allyGroup.combatantIds,
    enemyGroup.combatantIds
  );

  return partyWipesResult;
}
