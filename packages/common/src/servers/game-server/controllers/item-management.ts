import { CombatantId } from "../../../aliases.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class ItemManagementController {
  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}
}
