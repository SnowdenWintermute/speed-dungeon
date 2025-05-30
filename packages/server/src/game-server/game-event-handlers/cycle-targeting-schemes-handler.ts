import {
  CharacterAssociatedData,
  CombatantContext,
  ERROR_MESSAGES,
  ServerToClientEvent,
  TargetingCalculator,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function cycleTargetingSchemesHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const { username } = characterAssociatedData.player;
  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, character),
    playerOption
  );

  targetingCalculator.cycleCharacterTargetingSchemes(character.entityProperties.id);

  // @PERF - don't really need to send the username since we can ask the client
  // to just trust the server and find the username for this character on their own
  // for now we'll send it since we need the username for the cycleTargetingSchemesHandler on the client
  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargetingSchemes,
      character.entityProperties.id,
      username
    );
}
