import { describe, it, expect } from "vitest";
import { IdentityProviderService } from "./services/identity-provider.js";
import { SavedCharactersService } from "./services/saved-characters.js";

import { InMemorySpeedDungeonProfileService } from "./services/profiles.test.js";
import { FakeUsersIdentityProviderQueryStrategy } from "./services/identity-provider.test.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "./services/saved-characters.test.js";
import { InMemoryRankedLadderService } from "./services/ranked-ladder.test.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LobbyLocalClientIntentReceiver } from "./local-client-intent-receiver.js";
import { Lobby } from "./index.js";
import {
  GameSimulatorConnectionInstructions,
  GameSimulatorConnectionType,
} from "./game-simulator-handoff-strategy.js";
import { GameName } from "../aliases.js";
import { GameMode } from "../types.js";
import { InMemoryTransport } from "../transport/in-memory-transport.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameStateUpdateDispatchType } from "./update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";

describe("Lobby", () => {
  let inMemoryTransport: InMemoryTransport;
  let lobbyLocalClientIntentReceiver: LobbyLocalClientIntentReceiver;
  let lobby: Lobby;

  beforeEach(() => {
    inMemoryTransport = new InMemoryTransport();

    lobbyLocalClientIntentReceiver = new LobbyLocalClientIntentReceiver(
      inMemoryTransport.getServerConnectionEndpointManager()
    );

    const fakeGameHandoffStrategy = (
      game: SpeedDungeonGame
    ): GameSimulatorConnectionInstructions => {
      console.log("game handed off");
      return {
        type: GameSimulatorConnectionType.Local,
      };
    };

    lobby = new Lobby(
      lobbyLocalClientIntentReceiver,
      {
        handoff: fakeGameHandoffStrategy,
      },
      createLobbyTestServices()
    );
  });

  it("game creation", async () => {
    // make a game host
    const { serverEndpoint: serverEndpointForGameHost, _c1 } =
      await inMemoryTransport.createConnection();
    const gameHostSession = lobby.userSessionRegistry.getExpectedSession(
      serverEndpointForGameHost.id
    );

    // make another lobby user
    const { serverEndpoint: serverEndpointForOtherInLobby, _c2 } =
      await inMemoryTransport.createConnection();
    const otherLobbyUserSession = lobby.userSessionRegistry.getExpectedSession(
      serverEndpointForOtherInLobby.id
    );

    const gameName = "my game name" as GameName;
    const outbox = await lobby.gameLifecycleController.createGameHandler(
      { gameName, mode: GameMode.Race },
      gameHostSession
    );

    // game exists with creating player in it
    const game = lobby.lobbyState.getExpectedGame(gameName);
    expect(game.name).toEqual(gameName);
    expect(game.players[gameHostSession.username]).toBeDefined();

    // outbox created with correct messages
    const dispatches = outbox.toDispatches();

    // let's other user know the game host left the lobby
    const userLeftLobbyChannel = dispatches[0];
    expect(userLeftLobbyChannel).toEqual({
      type: GameStateUpdateDispatchType.FanOut,
      connectionIds: [otherLobbyUserSession.connectionId],
      update: {
        type: GameStateUpdateType.UserLeftChannel,
        data: { username: gameHostSession.username },
      },
    });

    // gives game host their new game data
    const newGameUpdate = dispatches[1];
    expect(newGameUpdate).toEqual({
      type: GameStateUpdateDispatchType.Single,
      connectionId: gameHostSession.connectionId,
      update: {
        type: GameStateUpdateType.GameFullUpdate,
        data: { game: game.getSerialized() },
      },
    });

    // tell clients already in the game that someone joined

    // other lobby user can get new game list and see the newly created game
  });
});

function createLobbyTestServices() {
  const identityProviderQueryStrategy = new FakeUsersIdentityProviderQueryStrategy(0);
  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
  const profileService = new InMemorySpeedDungeonProfileService(characterSlotsPersistenceStrategy);

  const savedCharactersService = new SavedCharactersService(
    new InMemorySavedCharacterSlotsPersistenceStrategy(),
    new InMemorySavedCharacterPersistenceStrategy()
  );

  const rankedLadderService = new InMemoryRankedLadderService();
  const externalServices = {
    identityProviderService,
    profileService,
    savedCharactersService,
    rankedLadderService,
    idGenerator: new IdGenerator({ saveHistory: false }),
  };
  return externalServices;
}
