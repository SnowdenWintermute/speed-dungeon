import { GameState } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export default function characterCycledTargetsHandler(
  characterId: string,
  direction: NextOrPrevious,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const maybeError = SpeedDungeonGame.cycleCharacterTargets(
        game,
        party,
        playerOption,
        characterId,
        direction
      );
      if (maybeError instanceof Error) return maybeError;

      synchronizeTargetingIndicators(
        gameState,
        character.combatantProperties.selectedCombatAction,
        character.entityProperties.id,
        targetIds || []
      );
    }
  );
}
