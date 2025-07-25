import {
  ActionCommandReceiver,
  ClientToServerEventTypes,
  EquipmentType,
  GameMessagesPayload,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers/index.js";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import joinSocketToChannel from "./join-socket-to-channel.js";
import { connectionHandler } from "./connection-handler.js";
import removeSocketFromChannel from "./remove-socket-from-channel.js";
import { HashMap } from "@speed-dungeon/common";
import getConnection from "./get-connection.js";
import getSocketCurrentGame from "./utils/get-socket-current-game.js";
import getSocketIdOfPlayer from "./get-player-socket-id.js";
import { exploreNextRoom } from "./game-event-handlers/toggle-ready-to-explore-handler.js";
import initiateGameEventListeners from "./game-event-handlers/index.js";
import { ItemGenerationDirector } from "./item-generation/item-generation-director.js";
import { generateRandomItem } from "./item-generation/generate-random-item.js";
import { battleResultActionCommandHandler } from "./game-event-handlers/action-command-handlers/battle-results.js";
import getGamePartyAndCombatant from "./utils/get-game-party-and-combatant.js";
import generateLoot from "./game-event-handlers/action-command-handlers/generate-loot.js";
import generateExperiencePoints from "./game-event-handlers/action-command-handlers/generate-experience-points.js";
import initiateSavedCharacterListeners from "./saved-character-event-handlers/index.js";
import GameModeContext from "./game-event-handlers/game-mode-strategies/game-mode-context.js";
import { ItemGenerationBuilder } from "./item-generation/item-generation-builder.js";
import { instantiateItemGenerationBuildersAndDirectors } from "./item-generation/instantiate-item-generation-builders-and-directors.js";

export type Username = string;
export type SocketId = string;
export type ChannelName = string;

export class Channel {
  users: Partial<Record<string, { [socketId: string]: BrowserTabSession }>> = {};
}

export class GameServer implements ActionCommandReceiver {
  games: HashMap<string, SpeedDungeonGame> = new HashMap();
  socketIdsByUsername: HashMap<Username, SocketId[]> = new HashMap();
  connections: HashMap<SocketId, BrowserTabSession> = new HashMap();
  channels: Partial<Record<ChannelName, Channel>> = {};
  itemGenerationDirectors: Record<EquipmentType, ItemGenerationDirector>;
  itemGenerationBuilders: Record<EquipmentType, ItemGenerationBuilder>;
  gameModeContexts: Record<GameMode, GameModeContext> = {
    [GameMode.Race]: new GameModeContext(GameMode.Race),
    [GameMode.Progression]: new GameModeContext(GameMode.Progression),
  };
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    this.connectionHandler();
    const { builders, directors } = this.instantiateItemGenerationBuildersAndDirectors();
    this.itemGenerationDirectors = directors;
    this.itemGenerationBuilders = builders;
  }
  getConnection = getConnection;
  connectionHandler = connectionHandler;
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  initiateGameEventListeners = initiateGameEventListeners;
  initiateSavedCharacterListeners = initiateSavedCharacterListeners;
  joinSocketToChannel = joinSocketToChannel;
  removeSocketFromChannel = removeSocketFromChannel;
  //
  exploreNextRoom = exploreNextRoom;
  // ACTION COMMAND HANDLERS
  combatActionReplayTreeHandler = async () => {};
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  removePlayerFromGameCommandHandler: (username: string) => Promise<void> = async () => {}; // we only use it on the client
  async gameMessageCommandHandler(payload: GameMessagesPayload) {
    for (const message of payload.messages) {
      this.io.except(payload.partyChannelToExclude || "").emit(ServerToClientEvent.GameMessage, {
        type: message.type,
        message: message.text,
        showAfterActionQueueResolution: false,
      });
    }
  }
  // UTILS
  getSocketCurrentGame = getSocketCurrentGame;
  getSocketIdOfPlayer = getSocketIdOfPlayer;
  getGamePartyAndCombatant = getGamePartyAndCombatant;
  // ITEMS
  instantiateItemGenerationBuildersAndDirectors = instantiateItemGenerationBuildersAndDirectors;
  generateRandomItem = generateRandomItem;
  generateLoot = generateLoot;
  // EXP
  generateExperiencePoints = generateExperiencePoints;
}
