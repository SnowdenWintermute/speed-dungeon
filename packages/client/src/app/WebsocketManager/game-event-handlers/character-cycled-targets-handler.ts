import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import clientCharacterActionHandler from "../client-character-action-handler";

export default function characterCycledTargetsHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterId: string,
  direction: NextOrPrevious
) {
  clientCharacterActionHandler(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ game, party }: CharacterAssociatedData, gameState: GameState) => {
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[gameState.username];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      SpeedDungeonGame.cycleCharacterTargets(game, party, playerOption, characterId, direction);
    }
  );
}
