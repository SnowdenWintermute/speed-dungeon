import { SpeedDungeonGame } from "./index.js";
import { BattleResultActionCommandPayload } from "../action-processing/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/index.js";

/** Returns any levelups by character id  */
export function handleBattleVictory(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  payload: BattleResultActionCommandPayload
) {
  const { experiencePointChanges, loot } = payload;

  if (loot) {
    party.currentRoom.inventory.insertItems([...loot.consumables, ...loot.equipment]);
  }
  applyExperiencePointChanges(party, experiencePointChanges);
  const levelUps: { [entityId: string]: number } = {};

  const { combatantManager } = party;
  const partyMembers = combatantManager.getPartyMemberCombatants();

  for (const combatant of partyMembers) {
    const { combatantProperties } = combatant;
    const newLevelOption = combatantProperties.classProgressionProperties.awardLevelups();
    if (newLevelOption !== null) levelUps[combatant.entityProperties.id] = newLevelOption;
    // until revives are added, res dead characters to 1 hp
    if (combatantProperties.isDead()) {
      combatantProperties.resources.changeHitPoints(1);
    }
  }

  combatantManager.removeDungeonControlledCombatants();

  const battleIdToRemoveOption = party.battleId;
  party.battleId = null;
  if (battleIdToRemoveOption !== null) delete game.battles[battleIdToRemoveOption];

  return levelUps;
}
