import { ClientApplication } from "@/client-application";
import { GameClient } from "@/client-application/clients/game";
import { LobbyClient } from "@/client-application/clients/lobby";
import { GameServer, LobbyServer } from "@speed-dungeon/common";
import { ClientTestHarness } from "./test-utils/client-test-harness.js";

export interface IntegrationTestFixture {
  lobbyServer: LobbyServer;
  gameServer: GameServer;
  gameClientHarness: ClientTestHarness<GameClient>;
  lobbyClientHarness: ClientTestHarness<LobbyClient>;
  clientApplication: ClientApplication;
}
