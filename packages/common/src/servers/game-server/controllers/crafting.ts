import cloneDeep from "lodash.clonedeep";
import {
  CharacterAndItems,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../../packets/game-state-updates.js";
import { GameMode } from "../../../types.js";
import { SavedCharactersService } from "../../services/saved-characters.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { getPartyChannelName } from "../../../packets/channels.js";

export class CraftingController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersService: SavedCharactersService
  ) {}

  async convertItemsToShardsHandler(session: UserSession, data: CharacterAndItems) {
    const { characterId, itemIds } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    character.combatantProperties.abilityProperties.requireShardConversionPermitted(
      party.currentRoom.roomType
    );

    // clone the itemIds so we can send unmodified original to clients
    character.convertOwnedItemsToShards(cloneDeep(itemIds));

    if (game.mode === GameMode.Progression) {
      const pets = party.petManager.getAllPetsByOwnerId(character.getEntityId());
      await this.savedCharactersService.updateCharacter(character, pets);
    }
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterConvertedItemsToShards,
      data,
    });

    return outbox;
  }
}
