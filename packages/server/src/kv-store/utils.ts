import { Combatant, LadderDeathsUpdate, calculateTotalExperience } from "@speed-dungeon/common";
import { valkeyManager } from "./index.js";
import { CHARACTER_LEVEL_LADDER } from "./consts.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";

export async function removeDeadCharactersFromLadder(characters: {
  [combatantId: string]: Combatant;
}) {
  const ladderDeathsUpdate: LadderDeathsUpdate = {};

  for (const character of Object.values(characters)) {
    if (character.combatantProperties.hitPoints > 0) continue; // still alive

    const rank = await valkeyManager.context.zRevRank(
      CHARACTER_LEVEL_LADDER,
      character.entityProperties.id
    );
    if (rank === null) continue;
    ladderDeathsUpdate[character.entityProperties.name] = {
      owner: character.combatantProperties.controllingPlayer || "",
      rank,
      level: character.combatantProperties.level,
    };
    valkeyManager.context.zRem(CHARACTER_LEVEL_LADDER, [character.entityProperties.id]);
  }

  return ladderDeathsUpdate;
}

export async function loadLadderIntoKvStore() {
  await valkeyManager.context.del(CHARACTER_LEVEL_LADDER);
  console.log("loading kv ladder");
  const rows = await playerCharactersRepo.getAllByLevel();
  if (!rows) return console.error("Couldn't load character levels");
  console.log("rows: ", rows);
  const forValkey: { value: string; score: number }[] = [];
  for (const item of rows) {
    if (item.hitPoints <= 0) continue; // only allow living characters in the ladder
    console.log("current exp: ", item.experiencePoints);
    forValkey.push({
      value: item.id,
      score: calculateTotalExperience(item.level) + item.experiencePoints,
    });
  }

  await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, forValkey);
  const topTen = await valkeyManager.context.zRangeWithScores(CHARACTER_LEVEL_LADDER, 0, 10, {
    REV: true,
  });
  console.log("Top 10 characters by level: ", topTen);
}
