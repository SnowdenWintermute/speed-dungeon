import {
  AdventuringParty,
  Combatant,
  CombatantClass,
  CombatantContext,
  CombatantProperties,
  CombatantSpecies,
  DungeonRoomType,
  GameMode,
  IdGenerator,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  addCharacterToParty,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";
import { putPartyInNextRoom } from "../../game-event-handlers/toggle-ready-to-explore-handler.js";
import { Vector3 } from "@babylonjs/core";
import { outfitNewCharacter } from "../../item-generation/outfit-new-character.js";

export function setUpTestGameWithPartyInBattle(idGenerator: IdGenerator) {
  const game = new SpeedDungeonGame(idGenerator.generate(), "A Game", GameMode.Race);
  const partyId = idGenerator.generate();
  const partyName = "A Party";
  const party = new AdventuringParty(partyId, partyName);
  game.adventuringParties[partyName] = party;

  const playerName = "Player Name";
  const player = new SpeedDungeonPlayer(playerName);

  const character = new Combatant(
    { id: idGenerator.generate(), name: "R. Chambers" },
    new CombatantProperties(
      CombatantClass.Warrior,
      CombatantSpecies.Humanoid,
      null,
      player.username,
      Vector3.Zero()
    )
  );
  outfitNewCharacter(character);
  addCharacterToParty(game, party, player, character, false);
  updateCombatantHomePosition(character.entityProperties.id, character.combatantProperties, party);
  putPartyInNextRoom(game, party, DungeonRoomType.MonsterLair);
  return new CombatantContext(game, party, character);
}
