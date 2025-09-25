import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  ServerToClientEvent,
  TargetingCalculator,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { ActionUserContext } from "@speed-dungeon/common";

export function cycleTargetsHandler(
  eventData: { characterId: string; direction: NextOrPrevious },
  characterAssociatedData: CharacterAssociatedData
): Error | void {
  const { game, party, character } = characterAssociatedData;
  const { username } = characterAssociatedData.player;

  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  const targetingCalculator = new TargetingCalculator(
    new ActionUserContext(game, party, character),
    playerOption
  );

  const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();

  const targetingProperties = character.getTargetingProperties();

  targetingProperties.cycleTargets(eventData.direction, playerOption, validTargetsByDisposition);

  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargets,
      character.entityProperties.id,
      eventData.direction,
      username
    );
}
