import { ActionCommandReceiver } from "../../../action-processing/action-command-receiver.js";
import { ExplorationAction } from "../../../adventuring-party/dungeon-exploration-manager.js";
import { DungeonRoom, DungeonRoomType } from "../../../adventuring-party/dungeon-room.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { NUM_MONSTERS_PER_ROOM } from "../../../app-consts.js";
import { Battle } from "../../../battle/index.js";
import { Combatant } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { ItemGenerator } from "../../../items/item-creation/index.js";
import { generateMonster } from "../../../monsters/generate-monster.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { GameMode } from "../../../types.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { GameRegistry } from "../../game-registry.js";
import { SavedCharactersService } from "../../services/saved-characters.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { AssetAnalyzer } from "../asset-analyzer/index.js";
import { BattleProcessor } from "./battle-processor/index.js";

export class DungeonExplorationController {
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersService: SavedCharactersService,
    private readonly idGenerator: IdGenerator,
    private readonly itemGenerator: ItemGenerator,
    private readonly randomNumberGenerator: RandomNumberGenerator,
    private readonly gameEventCommandReceiver: ActionCommandReceiver,
    private readonly assetAnalyzer: AssetAnalyzer
  ) {}

  async toggleReadyToExploreHandler(
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const game = session.getExpectedCurrentGame();
    const player = game.getExpectedPlayer(session.username);
    const party = game.getExpectedParty(player.getExpectedPartyName());

    game.requireTimeStarted();
    game.requireInputUnlocked();
    party.requireInputUnlocked();
    party.requireNotInCombat();

    const { username } = player;
    const { dungeonExplorationManager } = party;
    dungeonExplorationManager.updatePlayerExplorationActionChoice(
      username,
      ExplorationAction.Explore
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.PlayerToggledReadyToDescendOrExplore,
      data: { username, explorationAction: ExplorationAction.Explore },
    });

    const allPlayersReadyToExplore = dungeonExplorationManager.allPlayersReadyToTakeAction(
      ExplorationAction.Explore,
      party
    );

    if (allPlayersReadyToExplore) {
      const exploreNextRoomOutbox = await this.exploreNextRoom(game, party);
      outbox.pushFromOther(exploreNextRoomOutbox);
    }

    return outbox;
  }

  private async exploreNextRoom(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    if (game.mode === GameMode.Progression) {
      // @PERF - later we can consider a correct way to "fire-and-forget" this persistence
      // but since it is more complexity and might not be all that slow we'll just await for now
      await this.savedCharactersService.updateAllInParty(game, party);
    }

    const { dungeonExplorationManager } = party;

    dungeonExplorationManager.clearPlayerExplorationActionChoices();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    const reachedEndOfFloor = !dungeonExplorationManager.unexploredRoomsExistOnCurrentFloor();
    if (reachedEndOfFloor) {
      dungeonExplorationManager.generateUnexploredRoomsQueue();

      const newRoomTypesListForClient = dungeonExplorationManager.getFilteredNewRoomListForClient();

      outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
        type: GameStateUpdateType.DungeonRoomTypesOnCurrentFloor,
        data: { roomTypes: newRoomTypesListForClient },
      });
    }

    const roomTypeToGenerate = dungeonExplorationManager.popNextUnexploredRoomType();

    const { actionEntityManager } = party;
    const actionEntitiesRemoved =
      actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

    const newMonsters = this.putPartyInNextRoom(game, party, roomTypeToGenerate);
    const serializedMonsters = newMonsters.map((combatant) => combatant.getSerialized());

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.DungeonRoomUpdate,
      data: {
        dungeonRoom: party.currentRoom,
        monsters: serializedMonsters,
        actionEntitiesToRemove: actionEntitiesRemoved,
      },
    });

    const battleOption = party.getBattleOption(game);
    if (battleOption === null) {
      return outbox;
    }

    const battle = battleOption;

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.BattleFullUpdate,
      data: {
        battle,
      },
    });

    const battleProcessor = new BattleProcessor(
      this.updateDispatchFactory,
      game,
      party,
      battleOption,
      this.idGenerator,
      this.itemGenerator,
      this.randomNumberGenerator,
      this.gameEventCommandReceiver,
      this.assetAnalyzer
    );
    const battleProcessingOutbox = await battleProcessor.processBattleUntilPlayerTurnOrConclusion();
    outbox.pushFromOther(battleProcessingOutbox);
    // if (maybeError instanceof Error) return maybeError;
    return outbox;
  }

  private putPartyInNextRoom(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    roomTypeToGenerate: DungeonRoomType
  ) {
    const { dungeonExplorationManager } = party;
    const floorNumber = dungeonExplorationManager.getCurrentFloor();

    const { room, monsters } = this.generateDungeonRoom(
      floorNumber,
      roomTypeToGenerate,
      party.dungeonExplorationManager.getCurrentRoomNumber() + 1
    );

    party.setCurrentRoom(room);

    for (const monster of monsters) {
      party.combatantManager.addCombatant(monster, game);
    }

    party.combatantManager.updateHomePositions();

    party.combatantManager.setAllCombatantsToHomePositions();

    dungeonExplorationManager.incrementExploredRoomsTrackers();

    if (party.combatantManager.monstersArePresent()) {
      const battleIdResult = Battle.createInitialized(game, party, this.idGenerator);
      party.battleId = battleIdResult;
    }

    return monsters;
  }

  private generateDungeonRoom(
    floor: number,
    roomType: DungeonRoomType,
    roomIndex: number
  ): { room: DungeonRoom; monsters: Combatant[] } {
    const monsters: Combatant[] = [];

    if (roomType === DungeonRoomType.MonsterLair) {
      for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
        const newMonster = generateMonster(
          floor,
          roomIndex,
          this.idGenerator,
          this.itemGenerator,
          this.randomNumberGenerator
        );

        monsters.push(newMonster);
      }
    }

    const room = new DungeonRoom(roomType);

    return { room, monsters };
  }
}
