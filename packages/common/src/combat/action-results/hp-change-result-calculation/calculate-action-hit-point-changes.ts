import { ActionResultCalculationArguments } from ".";
import { SpeedDungeonGame } from "../../../game";

export default function calculateActionHitPointChanges(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { battleOption, userId } = args;
  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, userId);
  if (partyResult instanceof Error) return partyResult;
}
