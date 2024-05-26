import { ERROR_MESSAGES, PlayerCharacter } from "@speed-dungeon/common";
import { setAlert } from "../../alerts";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";

export default function characterCreationHandler(
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  partyName: string,
  username: string,
  character: PlayerCharacter
) {
  mutateGameStore((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const player = game.players[username];
    if (!player) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    const characterId = character.entityProperties.id;

    // recreate the class on the client because need to get the combatant properties methods
    const characterWithClassMethods = new PlayerCharacter(
      character.nameOfControllingUser,
      character.combatantProperties.combatantClass,
      character.entityProperties.name,
      characterId
    );
    console.log(character.combatantProperties);
    Object.assign(characterWithClassMethods.combatantProperties, character.combatantProperties);

    party.characters[characterId] = characterWithClassMethods;
    party.characterPositions.push(characterId);
    player.characterIds[characterId] = null;
  });
}
