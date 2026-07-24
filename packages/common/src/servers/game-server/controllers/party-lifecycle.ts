import { AdventuringParty } from "../../../adventuring-party/index.js";
import { GameModePolicy } from "../../../game-modes/index.js";
import { PartyFateType } from "../../../ladder/records/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { createPartyWipeMessage, GameMessageType } from "../../../packets/game-message.js";
import { GameStateUpdate } from "../../../packets/game-state-updates.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { PartyDelayedGameMessageFactory } from "../party-delayed-game-message-factory.js";

export class PartyLifecyleController {
  private readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;

  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {
    this.partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(updateDispatchFactory);
  }

  async handlePartyWipe(game: SpeedDungeonGame, party: AdventuringParty, policy: GameModePolicy) {
    party.fate = { type: PartyFateType.Wipe, timestamp: Date.now() };
    await policy.persistence.onPartyWipe(game, party);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const ladderDeathMessagesOutbox = await policy.ladder.onPartyWipe(game, party);

    const remainingParties = Object.values(game.adventuringParties);
    if (remainingParties.length) {
      const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
      const partyWipedOutbox =
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          game.getChannelName(),
          GameMessageType.PartyWipe,
          createPartyWipeMessage(party.name, floorNumber, new Date(Date.now())),
          getPartyChannelName(game.name, party.name)
        );
      outbox.pushFromOther(partyWipedOutbox);
    }

    if (ladderDeathMessagesOutbox) {
      outbox.pushFromOther(ladderDeathMessagesOutbox);
    }
    return outbox;
  }
}
