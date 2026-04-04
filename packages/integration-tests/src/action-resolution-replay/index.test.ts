import {
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  GameServer,
  LobbyServer,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { ClientApplication } from "@/client-application";
import { ClientTestHarness } from "@/test-utils/client-test-harness.js";
import { enterTestGameSingleCharacter } from "@/fixtures/enter-test-game-single-character.js";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types.js";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures/index.js";
import { testToCharacterInParty } from "@/fixtures/test-to-character-in-party.js";
import { GameClient } from "@/client-application/clients/game/index.js";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "experiment with new architecture",
  ({ clientEndpointFactory }) => {
    let lobbyServer: LobbyServer;
    let gameServer: GameServer;
    let gameClientHarness: ClientTestHarness<GameClient>;
    let lobbyClientHarness: ClientTestHarness<LobbyClient>;
    let clientApplication: ClientApplication;
    const timeMachine = new TimeMachine();

    beforeEach(async () => {
      const setup = await enterTestGameSingleCharacter(
        clientEndpointFactory,
        timeMachine,
        "game 1"
      );
      lobbyServer = setup.lobbyServer;
      gameServer = setup.gameServer;
      clientApplication = setup.clientApplication;
      gameClientHarness = setup.gameClientHarness;
      lobbyClientHarness = setup.lobbyClientHarness;
    });

    afterEach(async () => {
      lobbyServer.closeTransportServer();
      gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("combat action", async () => {
      const { gameContext, gameClientRef } = clientApplication;

      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
      await gameClientHarness.toggleReadyToExplore();
      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

      const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
      const characterId = focusedCharacter.getEntityId();

      await gameClientHarness.selectHoldableHotswapSlot(characterId, 2);
      await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);

      const expectedMonster = gameContext
        .requireParty()
        .combatantManager.getDungeonControlledCombatants()[0];

      expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(48);
      expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(37);
      await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
      gameClientRef.get().leaveGame();
      expect(gameContext.gameOption).toBe(null);

      console.log("reconnect lobby");
      await clientApplication.topologyManager.enterOnline(
        `http://localhost:${TEST_LOBBY_SERVER_PORT}`
      );
      console.log("lobby connected");
      await testToCharacterInParty(
        lobbyClientHarness,
        clientApplication,
        CombatantClass.Warrior,
        "game 2"
      );
      console.log("about to try start game 2");
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.ToggleReadyToStartGame,
        data: undefined,
      });

      console.log(
        clientApplication.sequentialEventProcessor.pendingEvents,
        clientApplication.sequentialEventProcessor.currentEventProcessing
      );
      await clientApplication.sequentialEventProcessor.waitUntilIdle();
      console.log("idled");
      await clientApplication.transitionToGameServer.waitFor();

      console.log("after start game 2");
      // expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(38);
      // expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(28);
      // await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
      // expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(28);
      // expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(19);
      // await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
      // expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(18);
      // expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(10);
      // await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
      // expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(8);
      // expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(1);
      // await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
      // expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(0);
      // expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(1);
      // expect(clientApplication.actionMenu.getCurrentMenu().type).toBe(
      //   ActionMenuScreenType.ItemsOnGround
      // );
    });
  }
);

// async function testCharacterCreationRules(
//   lobbyClientHarness: ClientTestHarness,
//   clientApplication: ClientApplication
// ) {
//   await testToCharacterInParty(lobbyClientHarness, clientApplication, CombatantClass.Rogue);
//   const { gameContext, errorRecordService } = clientApplication;

//   await lobbyClientHarness.settleIntentResult({
//     type: ClientIntentType.CreateCharacter,
//     data: { name: "b" as EntityName, combatantClass: CombatantClass.Rogue },
//   });
//   await lobbyClientHarness.settleIntentResult({
//     type: ClientIntentType.CreateCharacter,
//     data: { name: "c" as EntityName, combatantClass: CombatantClass.Rogue },
//   });
//   expect(gameContext.requireParty().combatantManager.getAllCombatants().size).toBe(3);
//   const lastIntentId = await lobbyClientHarness.settleIntentResult({
//     type: ClientIntentType.CreateCharacter,
//     data: { name: "d" as EntityName, combatantClass: CombatantClass.Rogue },
//   });
//   expect(errorRecordService.getLastError()).toEqual({
//     message: ERROR_MESSAGES.GAME.MAX_PARTY_SIZE,
//     clientIntentSequenceId: lastIntentId,
//   });
//   const someOwnedCombatantId = gameContext
//     .requireParty()
//     .combatantManager.getPartyMemberCombatants()[0]
//     ?.getEntityId();
//   invariant(someOwnedCombatantId !== undefined);
//   await lobbyClientHarness.settleIntentResult({
//     type: ClientIntentType.DeleteCharacter,
//     data: { characterId: someOwnedCombatantId },
//   });
//   await lobbyClientHarness.settleIntentResult({
//     type: ClientIntentType.CreateCharacter,
//     data: { name: "d" as EntityName, combatantClass: CombatantClass.Warrior },
//   });
// }
