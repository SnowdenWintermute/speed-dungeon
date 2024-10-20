import {
  ActionCommandReceiver,
  ClientToServerEventTypes,
  EquipmentType,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers/index.js";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import joinSocketToChannel from "./join-socket-to-channel.js";
import { connectionHandler } from "./connection-handler.js";
import disconnectionHandler from "./disconnection-handler.js";
import removeSocketFromChannel from "./remove-socket-from-channel.js";
import { HashMap } from "@speed-dungeon/common";
import createGameHandler from "./lobby-event-handlers/create-game-handler.js";
import getConnection from "./get-connection.js";
import joinGameHandler from "./lobby-event-handlers/join-game-handler.js";
import leavePartyHandler from "./lobby-event-handlers/leave-party-handler.js";
import leaveGameHandler from "./lobby-event-handlers/leave-game-handler.js";
import joinPartyHandler from "./lobby-event-handlers/join-party-handler.js";
import createPartyHandler from "./lobby-event-handlers/create-party-handler.js";
import createCharacterHandler from "./lobby-event-handlers/create-character-handler.js";
import deleteCharacterHandler from "./lobby-event-handlers/delete-character-handler.js";
import toggleReadyToStartGameHandler from "./lobby-event-handlers/toggle-ready-to-start-game-handler.js";
import getSocketCurrentGame from "./utils/get-socket-current-game.js";
import handlePartyWipe from "./game-event-handlers/combat-action-results-processing/handle-party-wipe.js";
import { getSocketIdsOfPlayersInOtherParties } from "./get-socket-ids-of-players-in-other-parties.js";
import getSocketIdOfPlayer from "./get-player-socket-id.js";
import toggleReadyToExploreHandler, {
  exploreNextRoom,
} from "./game-event-handlers/toggle-ready-to-explore-handler.js";
import emitErrorEventIfError from "./emit-error-event-if-error.js";
import initiateGameEventListeners from "./game-event-handlers/index.js";
import characterActionHandler from "./game-event-handlers/character-action-handler.js";
import dropItemHandler from "./game-event-handlers/drop-item-handler.js";
import dropEquippedItemHandler from "./game-event-handlers/drop-equipped-item-handler.js";
import unequipSlotHandler from "./game-event-handlers/unequip-slot-handler.js";
import equipItemHandler from "./game-event-handlers/equip-item-handler.js";
import acknowledgeReceiptOfItemOnGroundHandler from "./game-event-handlers/acknowledge_receipt_of_item_on_ground_handler.js";
import pickUpItemHandler from "./game-event-handlers/pick-up-item-handler.js";
import { ItemGenerationDirector } from "./item-generation/item-generation-director.js";
import { createItemGenerationDirectors } from "./item-generation/create-item-generation-directors.js";
import { generateRandomItem } from "./item-generation/generate-random-item.js";
import selectCombatActionHandler from "./game-event-handlers/select-combat-action-handler.js";
import cycleTargetsHandler from "./game-event-handlers/cycle-targets-handler.js";
import cycleTargetingSchemesHandler from "./game-event-handlers/cycle-targeting-schemes-handler.js";
import { payAbilityCostsActionCommandHandler } from "./game-event-handlers/action-command-handlers/pay-ability-costs.js";
import moveIntoCombatActionPositionActionCommandHandler from "./game-event-handlers/action-command-handlers/move-into-combat-action-position.js";
import performCombatActionActionCommandHandler from "./game-event-handlers/action-command-handlers/perform-combat-action.js";
import returnHomeActionCommandHandler from "./game-event-handlers/action-command-handlers/return-home.js";
import changeEquipmentActionCommandHandler from "./game-event-handlers/action-command-handlers/change-equipment.js";
import battleResultActionCommandHandler from "./game-event-handlers/action-command-handlers/battle-results.js";
import getGamePartyAndCombatant from "./utils/get-game-party-and-combatant.js";
import useSelectedCombatActionHandler from "./game-event-handlers/character-uses-selected-combat-action-handler/index.js";
import processSelectedCombatAction from "./game-event-handlers/character-uses-selected-combat-action-handler/process-selected-combat-action.js";
import takeAiControlledTurnIfActive from "./game-event-handlers/combat-action-results-processing/take-ai-combatant-turn-if-active.js";
import generateLoot from "./game-event-handlers/action-command-handlers/generate-loot.js";
import generateExperiencePoints from "./game-event-handlers/action-command-handlers/generate-experience-points.js";
import playerAssociatedDataProvider from "./game-event-handlers/player-data-provider.js";
import toggleReadyToDescendHandler from "./game-event-handlers/toggle-ready-to-descend-handler.js";
import characterSpentAttributePointHandler from "./game-event-handlers/character-spent-attribute-point-handler.js";
import initiateSavedCharacterListeners from "./saved-character-event-handlers/index.js";
import selectProgressionGameCharacterHandler from "./lobby-event-handlers/select-progression-game-character-handler.js";
import selectProgressionGameStartingFloorHandler from "./lobby-event-handlers/select-progression-game-starting-floor-handler.js";
import requestGameListHandler from "./lobby-event-handlers/request-game-list-handler.js";

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
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    console.log("constructed game server");
    this.connectionHandler();
    this.itemGenerationDirectors = this.createItemGenerationDirectors();
  }
  getConnection = getConnection;
  connectionHandler = connectionHandler;
  disconnectionHandler = disconnectionHandler;
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  initiateGameEventListeners = initiateGameEventListeners;
  initiateSavedCharacterListeners = initiateSavedCharacterListeners;
  joinSocketToChannel = joinSocketToChannel;
  removeSocketFromChannel = removeSocketFromChannel;
  //
  requestGameListHandler = requestGameListHandler;
  createGameHandler = createGameHandler;
  joinGameHandler = joinGameHandler;
  leaveGameHandler = leaveGameHandler;
  createPartyHandler = createPartyHandler;
  joinPartyHandler = joinPartyHandler;
  leavePartyHandler = leavePartyHandler;
  createCharacterHandler = createCharacterHandler;
  deleteCharacterHandler = deleteCharacterHandler;
  toggleReadyToStartGameHandler = toggleReadyToStartGameHandler;
  selectProgressionGameCharacterHandler = selectProgressionGameCharacterHandler;
  selectProgressionGameStartingFloorHandler = selectProgressionGameStartingFloorHandler;
  //
  handlePartyWipe = handlePartyWipe;
  toggleReadyToExploreHandler = toggleReadyToExploreHandler;
  toggleReadyToDescendHandler = toggleReadyToDescendHandler;
  dropItemHandler = dropItemHandler;
  dropEquippedItemHandler = dropEquippedItemHandler;
  unequipSlotHandler = unequipSlotHandler;
  equipItemHandler = equipItemHandler;
  acknowledgeReceiptOfItemOnGroundHandler = acknowledgeReceiptOfItemOnGroundHandler;
  pickUpItemHandler = pickUpItemHandler;
  useSelectedCombatActionHandler = useSelectedCombatActionHandler;
  selectCombatActionHandler = selectCombatActionHandler;
  cycleTargetsHandler = cycleTargetsHandler;
  cycleTargetingSchemesHandler = cycleTargetingSchemesHandler;
  exploreNextRoom = exploreNextRoom;
  characterSpentAttributePointHandler = characterSpentAttributePointHandler;
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
  getSocketIdsOfPlayersInOtherParties = getSocketIdsOfPlayersInOtherParties;
  getSocketIdOfPlayer = getSocketIdOfPlayer;
  emitErrorEventIfError = emitErrorEventIfError;
  characterActionHandler = characterActionHandler;
  playerAssociatedDataProvider = playerAssociatedDataProvider;
  getGamePartyAndCombatant = getGamePartyAndCombatant;
  // ITEMS
  createItemGenerationDirectors = createItemGenerationDirectors;
  generateRandomItem = generateRandomItem;
  generateLoot = generateLoot;
  // EXP
  generateExperiencePoints = generateExperiencePoints;
}
