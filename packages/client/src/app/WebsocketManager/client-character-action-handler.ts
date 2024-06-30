import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { CharacterAssociatedData, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import { AlertState } from "@/stores/alert-store";
import getParty from "@/utils/getParty";

export default function clientCharacterActionHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterId: string,
  fn: (characterAssociatedData: CharacterAssociatedData) => Error | void
) {
  mutateGameState((gameState) => {
    if (!gameState.game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(mutateAlertState, partyResult.message);
    const party = partyResult;
    const characterResult = SpeedDungeonGame.getCharacter(game, party.name, characterId);
    if (characterResult instanceof Error)
      return setAlert(mutateAlertState, characterResult.message);
    const character = characterResult;
    const result = fn({ game, character, party });
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);
  });
}
