import {
  ActionCommand,
  ActionCommandType,
  AdventuringParty,
  BattleConclusion,
  BattleResultActionCommandPayload,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export async function getBattleConclusionCommandAndPayload(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  partyWipes: {
    alliesDefeated: boolean;
    opponentsDefeated: boolean;
  }
) {
  const gameServer = getGameServer();
  if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);

  let conclusion: BattleConclusion;
  let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
    equipment: [],
    consumables: [],
  };
  let experiencePointChanges: { [combatantId: string]: number } = {};

  if (partyWipes.alliesDefeated) {
    conclusion = BattleConclusion.Defeat;
  } else {
    conclusion = BattleConclusion.Victory;
    loot = gameServer.generateLoot(party);
    experiencePointChanges = gameServer.generateExperiencePoints(party);
  }

  const payload: BattleResultActionCommandPayload = {
    type: ActionCommandType.BattleResult,
    conclusion,
    loot: loot,
    experiencePointChanges,
    timestamp: Date.now(),
  };

  const battleConclusionActionCommand = new ActionCommand(
    game.name,
    party.characterPositions[0],
    payload,
    gameServer
  );

  return { payload, command: battleConclusionActionCommand };
}
