import {
  ActionCommandManager,
  ActionCommandReceiver,
  ClientToServerEventTypes,
  EquipmentType,
  GameMessagesPayload,
  GameMode,
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
import { createItemGenerationDirectors } from "./item-generation/create-item-generation-directors.js";
import { generateRandomItem } from "./item-generation/generate-random-item.js";
import { payAbilityCostsActionCommandHandler } from "./game-event-handlers/action-command-handlers/pay-ability-costs.js";
import moveIntoCombatActionPositionActionCommandHandler from "./game-event-handlers/action-command-handlers/move-into-combat-action-position.js";
import performCombatActionActionCommandHandler from "./game-event-handlers/action-command-handlers/perform-combat-action.js";
import returnHomeActionCommandHandler from "./game-event-handlers/action-command-handlers/return-home.js";
import changeEquipmentActionCommandHandler from "./game-event-handlers/action-command-handlers/change-equipment.js";
import battleResultActionCommandHandler from "./game-event-handlers/action-command-handlers/battle-results.js";
import getGamePartyAndCombatant from "./utils/get-game-party-and-combatant.js";
import processSelectedCombatAction from "./game-event-handlers/character-uses-selected-combat-action-handler/process-selected-combat-action.js";
import takeAiControlledTurnIfActive from "./game-event-handlers/combat-action-results-processing/take-ai-combatant-turn-if-active.js";
import generateLoot from "./game-event-handlers/action-command-handlers/generate-loot.js";
import generateExperiencePoints from "./game-event-handlers/action-command-handlers/generate-experience-points.js";
import initiateSavedCharacterListeners from "./saved-character-event-handlers/index.js";
import GameModeContext from "./game-event-handlers/game-mode-strategies/game-mode-context.js";

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
  itemGenerationDirectors: Partial<Record<EquipmentType, ItemGenerationDirector>>;
  gameModeContexts: Record<GameMode, GameModeContext> = {
    [GameMode.Race]: new GameModeContext(GameMode.Race),
    [GameMode.Progression]: new GameModeContext(GameMode.Progression),
  };
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    console.log("constructed game server");
    this.connectionHandler();
    this.itemGenerationDirectors = this.createItemGenerationDirectors();
  }
  gameMessageCommandHandler(
    actionCommandManager: ActionCommandManager,
    payload: GameMessagesPayload
  ) {
    console.log(...payload.messages);
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
  processSelectedCombatAction = processSelectedCombatAction;
  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;
  moveIntoCombatActionPositionActionCommandHandler =
    moveIntoCombatActionPositionActionCommandHandler;
  performCombatActionActionCommandHandler = performCombatActionActionCommandHandler;
  returnHomeActionCommandHandler = returnHomeActionCommandHandler;
  changeEquipmentActionCommandHandler = changeEquipmentActionCommandHandler;
  battleResultActionCommandHandler = battleResultActionCommandHandler;
  takeAiControlledTurnIfActive = takeAiControlledTurnIfActive;
  // UTILS
  getSocketCurrentGame = getSocketCurrentGame;
  getSocketIdOfPlayer = getSocketIdOfPlayer;
  getGamePartyAndCombatant = getGamePartyAndCombatant;
  // ITEMS
  createItemGenerationDirectors = createItemGenerationDirectors;
  generateRandomItem = generateRandomItem;
  generateLoot = generateLoot;
  // EXP
  generateExperiencePoints = generateExperiencePoints;
}
