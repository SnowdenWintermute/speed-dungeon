import { MAX_PARTY_NAME_LENGTH } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { AdventuringParty, getPartyChannelName, SpeedDungeonGame } from "../index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { IdGenerator } from "../utility-classes/index.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { RANDOM_PARTY_NAMES } from "./random-party-names.js";
import { SavedCharactersManager } from "./saved-characters-manager.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class PartySetupManager {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly savedCharactersManager: SavedCharactersManager,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly idGenerator: IdGenerator
  ) {}

  static getProgressionGamePartyName(gameName: string) {
    return `Delvers of ${gameName}`;
  }

  generateRandomPartyName() {
    return RANDOM_PARTY_NAMES[Math.floor(Math.random() * RANDOM_PARTY_NAMES.length)]!;
  }

  createPartyHandler(session: UserSession, game: SpeedDungeonGame, partyName: string) {
    if (session.currentPartyName) {
      throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);
    }

    if (partyName === "") {
      partyName = this.generateRandomPartyName();
    }

    if (partyName.length > MAX_PARTY_NAME_LENGTH) {
      throw new Error(`Party names may be no longer than ${MAX_PARTY_NAME_LENGTH} characters`);
    }

    if (game.adventuringParties[partyName]) {
      throw new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);
    }

    const party = AdventuringParty.createInitialized(this.idGenerator.generate(), partyName);
    game.addParty(party);

    this.updateGateway.submitToConnections(this.userSessionRegistry.in(game.getChannelName()), {
      type: GameStateUpdateType.PartyCreated,
      data: { partyId: party.id, partyName },
    });

    this.joinPartyHandler(session, game, party.name);
  }

  joinPartyHandler(session: UserSession, game: SpeedDungeonGame, partyName: string) {
    if (session.currentPartyName) {
      throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);
    }

    game.putPlayerInParty(partyName, session.username);

    const partyChannelName = getPartyChannelName(game.name, partyName);

    session.subscribeToChannel(partyChannelName);
    session.currentPartyName = partyName;

    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.PartyNameUpdate,
      data: { partyName },
    });

    this.updateGateway.submitToConnections(this.userSessionRegistry.in(game.getChannelName()), {
      type: GameStateUpdateType.PlayerChangedAdventuringParty,
      data: { playerName: session.username, partyName },
    });
  }

  async joinProgressionGamePartyWithDefaultCharacterHandler(
    session: UserSession,
    game: SpeedDungeonGame
  ) {
    const authorizedSession = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );

    const defaultSavedCharacter =
      await this.savedCharactersManager.getDefaultSavedCharacterForProgressionGame(
        authorizedSession
      );
    const { combatant } = defaultSavedCharacter;

    game.lowestStartingFloorOptionsBySavedCharacter[combatant.entityProperties.id] =
      combatant.combatantProperties.deepestFloorReached;

    const partyName = PartySetupManager.getProgressionGamePartyName(game.name);

    const party = game.getExpectedParty(partyName);
    const player = game.getExpectedPlayer(session.username);

    this.joinPartyHandler(session, game, partyName);

    game.addCharacterToParty(
      party,
      player,
      defaultSavedCharacter.combatant,
      defaultSavedCharacter.pets
    );

    game.setMaxStartingFloor();

    this.updateGateway.submitToConnections(this.userSessionRegistry.in(game.getChannelName()), {
      type: GameStateUpdateType.CharacterAddedToParty,
      data: {
        username: session.username,
        character: defaultSavedCharacter.combatant.getSerialized(),
        pets: defaultSavedCharacter.pets.map((pet) => pet.getSerialized()),
      },
    });
  }
}
