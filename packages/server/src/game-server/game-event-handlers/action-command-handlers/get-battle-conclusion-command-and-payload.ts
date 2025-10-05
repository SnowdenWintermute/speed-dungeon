import {
  ActionCommand,
  ActionCommandType,
  AdventuringParty,
  BattleConclusion,
  BattleResultActionCommandPayload,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  InputLock,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";

export async function getBattleConclusionCommandAndPayload(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  partyWipes: {
    alliesDefeated: boolean;
    opponentsDefeated: boolean;
  }
) {
  const gameServer = getGameServer();
  if (!party.hasCharacters()) throw new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);

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

    InputLock.unlockInput(party.inputLock);
  }

  const actionEntitiesRemoved = AdventuringParty.unregisterActionEntitiesOnBattleEndOrNewRoom(
    party,
    AdventuringParty.getBattleOption(party, game)
  );

  const payload: BattleResultActionCommandPayload = {
    type: ActionCommandType.BattleResult,
    conclusion,
    loot: loot,
    partyName: party.name,
    experiencePointChanges,
    actionEntitiesRemoved,
    timestamp: Date.now(),
  };

  const battleConclusionActionCommand = new ActionCommand(game.name, payload, gameServer);

  return { payload, command: battleConclusionActionCommand };
}
