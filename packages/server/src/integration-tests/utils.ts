import { Socket as ClientSocket, io as clientSocket } from "socket.io-client";
import {
  ServerToClientEvent,
  ClientToServerEvent,
  ClientToServerEventTypes,
  Combatant,
  CombatantClass,
  GameMode,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "../game-server";

export function registerSocket(
  name: string,
  serverAddress: string,
  clientSockets: {
    [name: string]: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>;
  }
): ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes> {
  const socket = clientSocket(serverAddress);
  clientSockets[name] = socket;
  return socket;
}

export async function waitForCondition(
  conditionFn: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
) {
  const startTime = Date.now();

  while (true) {
    if (await conditionFn()) return;

    if (Date.now() - startTime >= timeout) {
      throw new Error("Condition not met within timeout");
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export async function emitGameSetupForTwoUsers(
  gameName: string,
  user1: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>,
  user2: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const party1Name = "party 1";
  const party2Name = "party 2";
  const character1Name = "character 1";
  const character2Name = "character 2";
  let character1: Combatant;
  let character2: Combatant;
  user1.emit(ClientToServerEvent.CreateGame, { gameName, mode: GameMode.Race, isRanked: true });
  user1.emit(ClientToServerEvent.CreateParty, party1Name);
  user1.emit(ClientToServerEvent.CreateCharacter, {
    name: character1Name,
    combatantClass: CombatantClass.Mage,
  });

  user2.emit(ClientToServerEvent.JoinGame, gameName);
  user2.emit(ClientToServerEvent.CreateParty, party2Name);
  user2.emit(ClientToServerEvent.CreateCharacter, {
    name: character2Name,
    combatantClass: CombatantClass.Mage,
  });

  // best to wait for this event to make sure user1 doesn't ready up before user 2 has
  // created their character
  user2.on(ServerToClientEvent.CharacterAddedToParty, (_username, character) => {
    if (character.entityProperties.name !== character2Name) return;
    character2 = character;
    user2.off(ServerToClientEvent.CharacterAddedToParty);
  });

  user1.on(ServerToClientEvent.CharacterAddedToParty, (_username, character) => {
    if (character.entityProperties.name !== character1Name) return;
    character1 = character;
    user1.off(ServerToClientEvent.CharacterAddedToParty);
  });

  await waitForCondition(async () => {
    return character1 !== undefined && character2 !== undefined;
  });

  return { gameName, party1Name, party2Name, character1: character1!, character2: character2! };
}

export async function waitForUsersLeavingServer(
  gameServer: {
    current: GameServer | undefined;
  },
  userSockets: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>[]
) {
  for (const socket of userSockets) {
    socket.disconnect();
  }
  // wait for all games to be done so we don't try to write any game records
  // after the test is finished
  await waitForCondition(async () => {
    if (!gameServer.current) return false;
    return gameServer.current.games.size() === 0;
  });
}
