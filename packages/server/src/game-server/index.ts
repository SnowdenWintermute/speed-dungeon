import {
  ClientToServerEventTypes,
  DEEPEST_FLOOR,
  EquipmentType,
  IdGenerator,
  ItemPropertiesType,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  TwoHandedMeleeWeapon,
  randBetween,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers";
import { BrowserTabSession } from "./socket-connection-metadata";
import joinSocketToChannel from "./join-socket-to-channel";
import { connectionHandler } from "./connection-handler";
import disconnectionHandler from "./disconnection-handler";
import removeSocketFromChannel from "./remove-socket-from-channel";
import { HashMap } from "@speed-dungeon/common";
import createGameHandler from "./lobby-event-handlers/create-game-handler";
import getConnection from "./get-connection";
import joinGameHandler from "./lobby-event-handlers/join-game-handler";
import leavePartyHandler from "./lobby-event-handlers/leave-party-handler";
import leaveGameHandler from "./lobby-event-handlers/leave-game-handler";
import joinPartyHandler from "./lobby-event-handlers/join-party-handler";
import createPartyHandler from "./lobby-event-handlers/create-party-handler";
import createCharacterHandler from "./lobby-event-handlers/create-character-handler";
import deleteCharacterHandler from "./lobby-event-handlers/delete-character-handler";
import toggleReadyToStartGameHandler from "./lobby-event-handlers/toggle-ready-to-start-game-handler";
import getSocketCurrentGame from "./utils/get-socket-current-game";
import handlePartyWipe from "./game-event-handlers/combat-action-results-processing/handle-party-wipe";
import { getSocketIdsOfPlayersInOtherParties } from "./get-socket-ids-of-players-in-other-parties";
import getSocketIdOfPlayer from "./get-player-socket-id";
import toggleReadyToExploreHandler from "./game-event-handlers/toggle-ready-to-explore-handler";
import emitErrorEventIfError from "./emit-error-event-if-error";
import initiateGameEventListeners from "./game-event-handlers";
import characterActionHandler from "./game-event-handlers/character-action-handler";
import dropItemHandler from "./game-event-handlers/drop-item-handler";
import dropEquippedItemHandler from "./game-event-handlers/drop-equipped-item-handler";
import unequipSlotHandler from "./game-event-handlers/unequip-slot-handler";
import equipItemHandler from "./game-event-handlers/equip-item-handler";
import acknowledgeReceiptOfItemOnGroundHandler from "./game-event-handlers/acknowledge_receipt_of_item_on_ground_handler";
import pickUpItemHandler from "./game-event-handlers/pick-up-item-handler";
import { ItemGenerationDirector } from "./item-generation/item-generation-director";
import { createItemGenerationDirectors } from "./item-generation/create-item-generation-directors";

export type Username = string;
export type SocketId = string;

export class GameServer {
  games: HashMap<string, SpeedDungeonGame> = new HashMap();
  socketIdsByUsername: HashMap<Username, SocketId[]> = new HashMap();
  connections: HashMap<SocketId, BrowserTabSession> = new HashMap();
  itemGenerationDirectors: Partial<Record<EquipmentType, ItemGenerationDirector>>;
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    console.log("constructed game server");
    this.connectionHandler();
    this.itemGenerationDirectors = this.createItemGenerationDirectors();
    const idGenerator = new IdGenerator();
    for (let i = 0; i < 100; i += 1) {
      const randomIndex = randBetween(0, Object.keys(this.itemGenerationDirectors).length - 1);
      const randomItemGenerationDirector = Object.values(this.itemGenerationDirectors)[randomIndex];
      if (randomItemGenerationDirector === undefined) continue;
      const randomItemResult = randomItemGenerationDirector.createItem(
        randBetween(1, DEEPEST_FLOOR),
        idGenerator
      );
      if (randomItemResult instanceof Error) console.log(randomItemResult);
      else console.log("item result: ", randomItemResult.entityProperties.name);
      // const director = this.itemGenerationDirectors[EquipmentType.TwoHandedMeleeWeapon];
      // if (director !== undefined) {
      //   const itemResult = director.createItem(5, idGenerator, {
      //     type: ItemPropertiesType.Equipment,
      //     baseItem: {
      //       equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      //       baseItemType: TwoHandedMeleeWeapon.MahoganyStaff,
      //     },
      //   });
      //   console.log(itemResult);
      // }
    }
  }
  getConnection = getConnection;
  connectionHandler = connectionHandler;
  disconnectionHandler = disconnectionHandler;
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  initiateGameEventListeners = initiateGameEventListeners;
  joinSocketToChannel = joinSocketToChannel;
  removeSocketFromChannel = removeSocketFromChannel;
  createGameHandler = createGameHandler;
  joinGameHandler = joinGameHandler;
  leaveGameHandler = leaveGameHandler;
  createPartyHandler = createPartyHandler;
  joinPartyHandler = joinPartyHandler;
  leavePartyHandler = leavePartyHandler;
  createCharacterHandler = createCharacterHandler;
  deleteCharacterHandler = deleteCharacterHandler;
  toggleReadyToStartGameHandler = toggleReadyToStartGameHandler;
  handlePartyWipe = handlePartyWipe;
  toggleReadyToExploreHandler = toggleReadyToExploreHandler;
  dropItemHandler = dropItemHandler;
  dropEquippedItemHandler = dropEquippedItemHandler;
  unequipSlotHandler = unequipSlotHandler;
  equipItemHandler = equipItemHandler;
  acknowledgeReceiptOfItemOnGroundHandler = acknowledgeReceiptOfItemOnGroundHandler;
  pickUpItemHandler = pickUpItemHandler;
  // UTILS
  getSocketCurrentGame = getSocketCurrentGame;
  getSocketIdsOfPlayersInOtherParties = getSocketIdsOfPlayersInOtherParties;
  getSocketIdOfPlayer = getSocketIdOfPlayer;
  emitErrorEventIfError = emitErrorEventIfError;
  characterActionHandler = characterActionHandler;
  // ITEMS
  createItemGenerationDirectors = createItemGenerationDirectors;
}
