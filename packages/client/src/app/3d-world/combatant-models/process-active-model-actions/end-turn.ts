import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { GameWorld } from "../../game-world";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import { ModularCharacter } from "../modular-character";
import { CombatantModelActionType } from "../model-actions";

export default function endTurnModelActionProcessor(
  combatantModel: ModularCharacter,
  gameWorld: GameWorld
) {
  gameWorld.mutateGameState((gameState) => {
    const { game } = gameState;
    if (game === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const partyResult = gameState.getParty();
    if (partyResult instanceof Error) console.error(partyResult);
    const battleOptionResult = getCurrentBattleOption(game, partyResult.name);
    if (battleOptionResult instanceof Error) return console.error(battleOptionResult);
    if (battleOptionResult !== null) {
      SpeedDungeonGame.endActiveCombatantTurn(game, battleOptionResult);
    }
  });

  combatantModel.removeActiveModelAction(CombatantModelActionType.EndTurn);
}
