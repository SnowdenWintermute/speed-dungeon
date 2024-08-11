import { SpeedDungeonGame } from "@speed-dungeon/common";

export default function checkForDefeatedCombatantGroups(
  game: SpeedDungeonGame,
  allyIds: string[],
  opponentIds: string[]
):
  | Error
  | {
      alliesDefeated: boolean;
      opponentsDefeated: boolean;
    } {
  const alliesDefeatedResult = SpeedDungeonGame.allCombatantsInGroupAreDead(game, allyIds);
  if (alliesDefeatedResult instanceof Error) return alliesDefeatedResult;
  let opponentsDefeatedResult: boolean = false;
  const opponentsDefeatedResultResult = SpeedDungeonGame.allCombatantsInGroupAreDead(
    game,
    opponentIds
  );
  if (opponentsDefeatedResultResult instanceof Error) return opponentsDefeatedResultResult;
  opponentsDefeatedResult = opponentsDefeatedResultResult;

  return { alliesDefeated: alliesDefeatedResult, opponentsDefeated: opponentsDefeatedResult };
}
