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
  direction: NextOrPrevious,
  playerUsername: string
) {
  clientCharacterActionHandler(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ game, party }: CharacterAssociatedData, gameState: GameState) => {
      console.log("got character cycled targets");
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      return SpeedDungeonGame.cycleCharacterTargets(
        game,
        party,
        playerOption,
        characterId,
        direction
      );
    }
  );
}
