import {
  ActionCommandReceiver,
  ChannelName,
  CharacterCreator,
  ClientToServerEventTypes,
  GameMode,
  GameName,
  IdentityProviderService,
  ItemGenerator,
  LobbyServer,
  SavedCharactersService,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  UserIdentityResolutionContext,
  Username,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { initiateLobbyEventListeners } from "./lobby-event-handlers/index.js";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import joinSocketToChannel from "./join-socket-to-channel.js";
import { connectionHandler } from "./connection-handler.js";
import removeSocketFromChannel from "./remove-socket-from-channel.js";
import getConnection from "./get-connection.js";
import getSocketCurrentGame from "./utils/get-socket-current-game.js";
import getSocketIdOfPlayer from "./get-player-socket-id.js";
import { exploreNextRoom } from "./game-event-handlers/toggle-ready-to-explore-handler.js";
import initiateGameEventListeners from "./game-event-handlers/index.js";
import { battleResultActionCommandHandler } from "./game-event-handlers/action-command-handlers/battle-results.js";
import { generateLoot } from "./game-event-handlers/action-command-handlers/generate-loot.js";
import { generateExperiencePoints } from "./game-event-handlers/action-command-handlers/generate-experience-points.js";
import initiateSavedCharacterListeners from "./saved-character-event-handlers/index.js";
import GameModeContext from "./game-event-handlers/game-mode-strategies/game-mode-context.js";
import { idGenerator, rngSingleton } from "../singletons/index.js";
import { AffixGenerator } from "@speed-dungeon/common";
import { RemoteGameSimuatorHandoffStrategy } from "./lobby-setup/remote-game-simulator-handoff-strategy.js";
import { DatabaseProfileService } from "./services/profiles.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import {
  DatabaseSavedCharacterPersistenceStrategy,
  DatabaseSavedCharacterSlotsPersistenceStrategy,
} from "./services/saved-characters.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { characterSlotsRepo } from "../database/repos/character-slots.js";
import { DatabaseRankedLadderService } from "./services/ranked-ladder.js";
import { valkeyManager } from "../kv-store/index.js";
import { getLoggedInUserOrCreateGuest } from "./get-logged-in-user-or-create-guest.js";
import { GameMessagesPayload } from "@speed-dungeon/common";
import { LobbyRemoteIncomingConnectionGateway } from "./client-intent-receivers/remote-lobby.js";

export type SocketId = string;

export class Channel {
  users: Partial<Record<Username, Record<SocketId, BrowserTabSession>>> = {};
}

export class GameServerNode implements ActionCommandReceiver {
  itemGenerator: ItemGenerator = new ItemGenerator(
    idGenerator,
    rngSingleton,
    new AffixGenerator(rngSingleton)
  );
  characterCreator: CharacterCreator;
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    this.connectionHandler();
    this.characterCreator = new CharacterCreator(idGenerator, this.itemGenerator);

    const usersIncomingConnectionGateway = new LobbyRemoteIncomingConnectionGateway(this.io);
    const gameSimulatorHandoffStrategy = new RemoteGameSimuatorHandoffStrategy();
    const externalServices = this.createLobbyExternalServices();
    const lobbyServer = new LobbyServer(
      usersIncomingConnectionGateway,
      gameSimulatorHandoffStrategy,
      externalServices
    );
  }
  // game manager
  games = new Map<GameName, SpeedDungeonGame>();
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  initiateGameEventListeners = initiateGameEventListeners;
  initiateSavedCharacterListeners = initiateSavedCharacterListeners;
  exploreNextRoom = exploreNextRoom;
  generateExperiencePoints = generateExperiencePoints;
  // action command handlers
  combatActionReplayTreeHandler = async () => {
    return undefined;
  };
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  removePlayerFromGameCommandHandler: (username: string) => Promise<void> = async () => undefined; // we only use it on the client
  async gameMessageCommandHandler(payload: GameMessagesPayload) {
    for (const message of payload.messages) {
      this.io
        .except(payload.partyChannelToExclude || "")
        .emit(ServerToClientEvent.GameMessage, message);
    }
  }

  // socket connection manager
  socketIdsByUsername = new Map<Username, SocketId[]>();
  connections = new Map<SocketId, BrowserTabSession>();
  channels: Partial<Record<ChannelName, Channel>> = {};
  getConnection = getConnection;
  connectionHandler = connectionHandler;
  joinSocketToChannel = joinSocketToChannel;
  removeSocketFromChannel = removeSocketFromChannel;
  getSocketCurrentGame = getSocketCurrentGame;
  getSocketIdOfPlayer = getSocketIdOfPlayer;

  // item creation
  generateLoot = generateLoot;

  // strategy pattern for handling certain events
  gameModeContexts: Record<GameMode, GameModeContext> = {
    [GameMode.Race]: new GameModeContext(GameMode.Race),
    [GameMode.Progression]: new GameModeContext(GameMode.Progression),
  };

  createLobbyExternalServices() {
    const identityProviderService = new IdentityProviderService({
      execute: async (context: UserIdentityResolutionContext) => {
        return await getLoggedInUserOrCreateGuest(context.cookies);
      },
    });

    const profileService = new DatabaseProfileService(speedDungeonProfilesRepo);

    const savedCharactersPersistenceStrategy = new DatabaseSavedCharacterPersistenceStrategy(
      playerCharactersRepo
    );

    const savedCharacterSlotsPersistenceStrategy =
      new DatabaseSavedCharacterSlotsPersistenceStrategy(characterSlotsRepo);
    const savedCharactersService = new SavedCharactersService(
      savedCharacterSlotsPersistenceStrategy,
      savedCharactersPersistenceStrategy
    );

    const rankedLadderService = new DatabaseRankedLadderService(valkeyManager.context);

    const externalServices = {
      identityProviderService,
      profileService,
      savedCharactersService,
      rankedLadderService,
      idGenerator,
    };

    return externalServices;
  }
}
