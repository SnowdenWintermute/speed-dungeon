import util from "util";
import {
  Combatant,
  CombatantClass,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  MonsterType,
  ServerToClientEvent,
  SpeedDungeonGame,
  addCharacterToParty,
  runIfInBrowser,
} from "@speed-dungeon/common";
import { createCharacter } from "../character-creation/index.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";
import { generateMonster } from "../monster-generation/index.js";
import { makeAutoObservable, toJS } from "mobx";

export function createCharacterHandler(
  eventData: { name: string; combatantClass: CombatantClass },
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { game, partyOption, player, session } = playerAssociatedData;
  if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

  const { name, combatantClass } = eventData;

  if (name.length > MAX_CHARACTER_NAME_LENGTH) {
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
  }

  const newCharacter = createCharacter(name, combatantClass, player.username);
  if (newCharacter instanceof Error) return newCharacter;

  // @TESTING - pets
  // @TODO - don't start a new character with any pets
  const pets: Combatant[] = [generateMonster(1, MonsterType.Wolf)];

  addCharacterToParty(game, partyOption, player, newCharacter, pets);

  const serialized = newCharacter.getSerialized();
  console.log("serialized character: ");
  console.dir(serialized.combatantProperties, { depth: null, colors: true });
  const cloned = structuredClone(serialized);

  console.log(util.inspect(cloned, { depth: null, showHidden: true }));

  getGameServer()
    .io.of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, session.username, cloned, []);
  // .emit(ServerToClientEvent.TestCircularRef, serializedParent);
  console.log("after emit");
}

import { Exclude, instanceToPlain } from "class-transformer";
import cloneDeep from "lodash.clonedeep";

export class MyParentClass {
  myParentField: number = 1;
  myChildClass = new MyCircularClass();
  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }
  initialize() {
    this.myChildClass.initialize(this);
  }

  getSerialized() {
    const cloned = cloneDeep(this);
    return instanceToPlain(cloned) as MyParentClass;
  }
}

class MyCircularClass {
  @Exclude()
  public myParentClass: MyParentClass | null = null;
  constructor() {}

  initialize(myParentClass: MyParentClass) {
    this.myParentClass = myParentClass;
  }
}
