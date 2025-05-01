import { GameState } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  TargetingCalculator,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterCycledTargetingSchemesHandler(
  characterId: string,
  playerUsername: string
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[playerUsername];
      if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const targetingCalculator = new TargetingCalculator(game, party, character, playerOption);
      return targetingCalculator.cycleCharacterTargetingSchemes(characterId);
    }
  );
}
