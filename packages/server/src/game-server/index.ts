import {
  ActionCommandReceiver,
  ClientToServerEventTypes,
  EquipmentType,
  IdGenerator,
  ServerToClientEventTypes,
  SpeedDungeonGame,
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
import { generateRandomItem } from "./item-generation/generate-random-item";
import selectCombatActionHandler from "./game-event-handlers/select-combat-action-handler";
import cycleTargetsHandler from "./game-event-handlers/cycle-targets-handler";
import cycleTargetingSchemesHandler from "./game-event-handlers/cycle-targeting-schemes-handler";
import { payAbilityCostsActionCommandHandler } from "./game-event-handlers/action-command-handlers/pay-ability-costs";
import moveIntoCombatActionPositionActionCommandHandler from "./game-event-handlers/action-command-handlers/move-into-combat-action-position";
import performCombatActionActionCommandHandler from "./game-event-handlers/action-command-handlers/perform-combat-action";
import returnHomeActionCommandHandler from "./game-event-handlers/action-command-handlers/return-home";
import changeEquipmentActionCommandHandler from "./game-event-handlers/action-command-handlers/change-equipment";
import battleResultActionCommandHandler from "./game-event-handlers/action-command-handlers/battle-results";
import getGamePartyAndCombatant from "./utils/get-game-party-and-combatant";
import useSelectedCombatActionHandler from "./game-event-handlers/character-uses-selected-combat-action-handler";
import processSelectedCombatAction from "./game-event-handlers/character-uses-selected-combat-action-handler/process-selected-combat-action";
import takeAiControlledTurnIfActive from "./game-event-handlers/combat-action-results-processing/take-ai-combatant-turn-if-active";
import generateLoot from "./game-event-handlers/action-command-handlers/generate-loot";
import generateExperiencePoints from "./game-event-handlers/action-command-handlers/generate-experience-points";
import playerAssociatedDataProvider from "./game-event-handlers/player-data-provider";
import toggleReadyToDescendHandler from "./game-event-handlers/toggle-ready-to-descend-handler";

export type Username = string;
export type SocketId = string;

export class GameServer implements ActionCommandReceiver {
  games: HashMap<string, SpeedDungeonGame> = new HashMap();
  socketIdsByUsername: HashMap<Username, SocketId[]> = new HashMap();
  connections: HashMap<SocketId, BrowserTabSession> = new HashMap();
  itemGenerationDirectors: Partial<Record<EquipmentType, ItemGenerationDirector>>;
  constructor(public io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    console.log("constructed game server");
    this.connectionHandler();
    this.itemGenerationDirectors = this.createItemGenerationDirectors();
    const idGenerator = new IdGenerator();
    // for (let i = 0; i < 100; i += 1) {
    //   const iLvl = randBetween(1, DEEPEST_FLOOR);
    //   const randomItem = this.generateRandomItem(iLvl, idGenerator);
    //   if (!(randomItem instanceof Error)) console.log(randomItem.entityProperties.name);
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
    // }
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
