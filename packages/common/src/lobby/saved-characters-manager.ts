import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { SavedCharacterLoader } from "./saved-character-loader.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { AuthorizedSession, UserSession } from "./user-session.js";

export class SavedCharactersManager {
  constructor(
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly savedCharacterLoader: SavedCharacterLoader
  ) {}

  async fetchSavedCharactersHandler(session: UserSession) {
    const authorizedSession = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );
    const charactersResult = await this.savedCharacterLoader.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    // tell this session about their saved characters
    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterSlots: charactersResult },
    });
  }

  async getDefaultSavedCharacterForProgressionGame(authorizedSession: AuthorizedSession) {
    const charactersResult = await this.savedCharacterLoader.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    // only let them create/join a progression game if they have a saved character
    if (Object.values(charactersResult).length === 0) {
      throw new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
    }

    // get the first living character slot
    let defaultSavedCharacter: { combatant: Combatant; pets: Combatant[] } | undefined = undefined;

    for (const character of Object.values(charactersResult)) {
      if (!character.combatant.combatantProperties.isDead()) {
        defaultSavedCharacter = character;
        break;
      }
    }

    if (defaultSavedCharacter === undefined) {
      throw new Error(ERROR_MESSAGES.USER.NO_LIVING_CHARACTERS);
    }

    return defaultSavedCharacter;
  }
}
