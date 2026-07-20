import { GameStateUpdate } from "../packets/game-state-updates.js";
import { GameRegistry } from "../servers/game-registry.js";
import { PartyDelayedGameMessageFactory } from "../servers/game-server/party-delayed-game-message-factory.js";
import { GameExistenceChecker } from "../servers/lobby-server/game-existence-queries.js";
import { CrossServerBroadcasterService } from "../servers/services/cross-server-broadcaster/index.js";
import { GameSessionStoreService } from "../servers/services/game-session-store/index.js";
import { SpeedDungeonProfileService } from "../servers/services/profiles.js";
import { CharacterLevelLadderService } from "../servers/services/ranked-ladder.js";
import { ServerCommand } from "../servers/services/server-command/index.js";
import { UserGameDataPersistenceService } from "../servers/services/user-game-data-persistence/index.js";
import { UserSessionRegistry } from "../servers/sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { IdGenerator } from "../utility-classes/index.js";
import { GameModeGameInitializationPolicy } from "./game-initialization-policy.js";
import { GameMode, GameModePolicy } from "./index.js";
import { IronmanGameInitializationPolicy } from "./ironman-mode/game-initialization-policy.js";
import { IronmanModeInGameDecisionsPolicy } from "./ironman-mode/in-game-decisions-policy.js";
import { IronmanModeLadderPolicy } from "./ironman-mode/ladder-policy.js";
import { IronmanModeLobbySetup } from "./ironman-mode/lobby-setup-policy.js";
import { IronmanModePersistencePolicy } from "./ironman-mode/persistence-policy.js";
import { LadderGameRecordsService } from "./ladder-records/ladder-records-service.js";
import { ProgressionModeInGameDecisionsPolicy } from "./progression-mode/in-game-decisions-policy.js";
import { ProgressionModeLadderPolicy } from "./progression-mode/ladder-policy.js";
import { ProgressionModeLobbySetup } from "./progression-mode/lobby-setup-policy.js";
import { ProgressionModePersistencePolicy } from "./progression-mode/persistence-policy.js";
import { RaceModesInGameDecisionsPolicy } from "./race-modes/in-game-decisions-policy.js";
import { RaceModesPersistencePolicy } from "./race-modes/persistence-policy.js";
import { RankedRaceModeLadderPolicy } from "./race-modes/ranked-race-ladder-policy.js";
import { RankedRaceModeLobbySetup } from "./race-modes/ranked-race-lobby-setup-policy.js";
import { UnrankedRaceModeLadderPolicy } from "./race-modes/unranked-race-ladder-policy.js";
import { UnrankedRaceModeLobbySetup } from "./race-modes/unranked-race-lobby-setup-policy.js";

export class GameModePolicyStore {
  private policies: Record<GameMode, GameModePolicy>;

  constructor(
    updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    profileService: SpeedDungeonProfileService,
    characterLevelLadderService: CharacterLevelLadderService,
    ladderGameRecordsService: LadderGameRecordsService,
    userGameDataPersistenceService: UserGameDataPersistenceService,
    userSessionRegistry: UserSessionRegistry,
    gameRegistry: GameRegistry,
    gameSessionStoreService: GameSessionStoreService,
    gameExistenceChecker: GameExistenceChecker,
    idGenerator: IdGenerator
  ) {
    const partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
      updateDispatchFactory
    );
    this.policies = {
      [GameMode.Ironman]: {
        inGameDecisions: new IronmanModeInGameDecisionsPolicy(),
        gameInitialization: new IronmanGameInitializationPolicy(updateDispatchFactory),
        lobbySetup: new IronmanModeLobbySetup(
          profileService,
          userGameDataPersistenceService,
          gameRegistry,
          gameSessionStoreService,
          gameExistenceChecker,
          idGenerator,
          updateDispatchFactory
        ),
        persistence: new IronmanModePersistencePolicy(
          userSessionRegistry,
          profileService,
          userGameDataPersistenceService,
          updateDispatchFactory
        ),
        ladder: new IronmanModeLadderPolicy(
          userSessionRegistry,
          characterLevelLadderService,
          userGameDataPersistenceService,
          ladderGameRecordsService,
          updateDispatchFactory,
          partyDelayedGameMessageFactory,
          crossServerBroadcasterService,
          idGenerator
        ),
      },
      [GameMode.Progression]: {
        inGameDecisions: new ProgressionModeInGameDecisionsPolicy(),
        gameInitialization: new GameModeGameInitializationPolicy(updateDispatchFactory),
        lobbySetup: new ProgressionModeLobbySetup(
          profileService,
          userGameDataPersistenceService,
          gameRegistry,
          gameSessionStoreService,
          gameExistenceChecker,
          idGenerator,
          updateDispatchFactory
        ),
        persistence: new ProgressionModePersistencePolicy(
          userSessionRegistry,
          profileService,
          userGameDataPersistenceService,
          updateDispatchFactory
        ),
        ladder: new ProgressionModeLadderPolicy(
          userSessionRegistry,
          characterLevelLadderService,
          userGameDataPersistenceService,
          ladderGameRecordsService,
          updateDispatchFactory,
          partyDelayedGameMessageFactory,
          crossServerBroadcasterService,
          idGenerator
        ),
      },
      [GameMode.RankedRace]: {
        inGameDecisions: new RaceModesInGameDecisionsPolicy(),
        gameInitialization: new GameModeGameInitializationPolicy(updateDispatchFactory),
        lobbySetup: new RankedRaceModeLobbySetup(
          profileService,
          userGameDataPersistenceService,
          gameRegistry,
          gameSessionStoreService,
          gameExistenceChecker,
          idGenerator,
          updateDispatchFactory
        ),
        persistence: new RaceModesPersistencePolicy(
          userSessionRegistry,
          profileService,
          userGameDataPersistenceService,
          updateDispatchFactory
        ),
        ladder: new RankedRaceModeLadderPolicy(
          userSessionRegistry,
          characterLevelLadderService,
          userGameDataPersistenceService,
          ladderGameRecordsService,
          updateDispatchFactory,
          partyDelayedGameMessageFactory,
          crossServerBroadcasterService,
          idGenerator
        ),
      },
      [GameMode.UnrankedRace]: {
        inGameDecisions: new RaceModesInGameDecisionsPolicy(),
        gameInitialization: new GameModeGameInitializationPolicy(updateDispatchFactory),
        lobbySetup: new UnrankedRaceModeLobbySetup(
          profileService,
          userGameDataPersistenceService,
          gameRegistry,
          gameSessionStoreService,
          gameExistenceChecker,
          idGenerator,
          updateDispatchFactory
        ),
        persistence: new RaceModesPersistencePolicy(
          userSessionRegistry,
          profileService,
          userGameDataPersistenceService,
          updateDispatchFactory
        ),
        ladder: new UnrankedRaceModeLadderPolicy(
          userSessionRegistry,
          characterLevelLadderService,
          userGameDataPersistenceService,
          ladderGameRecordsService,
          updateDispatchFactory,
          partyDelayedGameMessageFactory,
          crossServerBroadcasterService,
          idGenerator
        ),
      },
    };
  }

  getPolicy(mode: GameMode): GameModePolicy {
    return this.policies[mode];
  }
}
