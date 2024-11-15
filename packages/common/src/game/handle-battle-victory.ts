import { SpeedDungeonGame } from "./index.js";
import { BattleResultActionCommandPayload } from "../action-processing/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantProperties, applyExperiencePointChanges } from "../combatants/index.js";

/** Returns any levelups by character id  */
export default function handleBattleVictory(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  payload: BattleResultActionCommandPayload
) {
  const { experiencePointChanges, loot } = payload;
  party.currentRoom.items.push(...loot);
  applyExperiencePointChanges(party, experiencePointChanges);
  const levelUps: { [entityId: string]: number } = {};
  for (const character of Object.values(party.characters)) {
    const newLevelOption = CombatantProperties.awardLevelups(character.combatantProperties);
    if (newLevelOption !== null) levelUps[character.entityProperties.id] = newLevelOption;
    // until revives are added, res dead characters to 1 hp
    if (character.combatantProperties.hitPoints <= 0) character.combatantProperties.hitPoints = 1;
  }

  party.currentRoom.monsters = {};
  party.currentRoom.monsterPositions = [];

  const battleIdToRemoveOption = party.battleId;
  party.battleId = null;
  if (battleIdToRemoveOption !== null) delete game.battles[battleIdToRemoveOption];

  return levelUps;
}
