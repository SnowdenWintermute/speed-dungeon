import { GameState } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterCycledTargetsHandler(
  characterId: string,
  direction: NextOrPrevious,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party }: CharacterAssociatedData, gameState: GameState) => {
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
