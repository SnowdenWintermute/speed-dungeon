import {
  CharacterAssociatedData,
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

  const player = game.getExpectedPlayer(username);

  const targetingCalculator = new TargetingCalculator(
    new ActionUserContext(game, party, character),
    player
  );

  const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();

  const targetingProperties = character.getTargetingProperties();

  targetingProperties.cycleTargets(eventData.direction, player, validTargetsByDisposition);

  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargets,
      character.entityProperties.id,
      eventData.direction,
      username
    );
}
