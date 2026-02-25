import { CombatantId, EntityName, ItemId } from "../../../aliases.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class MiscUtilityController {
  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}

  postItemLinkHandler(session: UserSession, data: { itemId: ItemId }) {
    const { game, party } = session.requirePlayerContext();
    const { itemId } = data;
    const itemInPartyResult = party.getItem(itemId);
    if (itemInPartyResult instanceof Error) {
      throw itemInPartyResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.PlayerPostedItemLink,
      data: { username: session.username, itemId },
    });

    return outbox;
  }

  renamePetHandler(session: UserSession, data: { petId: CombatantId; newName: EntityName }) {
    const { game, party, player } = session.requirePlayerContext();
    const { petId, newName } = data;

    const pet = party.combatantManager.getExpectedCombatant(petId);

    const { controlledBy } = pet.combatantProperties;
    const isPetOfThisPlayer = controlledBy.wasSummonedByCharacterControlledByPlayer(
      player.username,
      party
    );
    if (!isPetOfThisPlayer) {
      throw new Error("Can't rename a pet of a character you do not control");
    }

    pet.entityProperties.name = newName as EntityName;

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterRenamedPet,
      data,
    });

    return outbox;
  }
}
