import { ActionCommandReceiver } from "../../../../action-processing/action-command-receiver.js";
import { ActionCommand } from "../../../../action-processing/action-command.js";
import {
  ActionCommandType,
  BattleResultActionCommandPayload,
} from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatantId } from "../../../../aliases.js";
import { NUM_MONSTERS_PER_ROOM } from "../../../../app-consts.js";
import { BattleConclusion } from "../../../../battle/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { Consumable } from "../../../../items/consumables/index.js";
import { Equipment } from "../../../../items/equipment/index.js";
import { ItemGenerator } from "../../../../items/item-creation/index.js";
import { PartyWipes } from "../../../../types.js";
import { RandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { generateExperiencePoints } from "./generate-experience-points.js";

export async function getBattleConclusionCommandAndPayload(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  partyWipes: PartyWipes,
  itemGenerator: ItemGenerator,
  rng: RandomNumberGenerator,
  gameEventCommandReceiver: ActionCommandReceiver
) {
  let conclusion: BattleConclusion;
  let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
    equipment: [],
    consumables: [],
  };

  let experiencePointChanges: Record<CombatantId, number> = {};

  if (partyWipes.alliesDefeated) {
    conclusion = BattleConclusion.Defeat;
  } else {
    conclusion = BattleConclusion.Victory;
    loot = itemGenerator.generateLoot(
      NUM_MONSTERS_PER_ROOM,
      party.dungeonExplorationManager.getCurrentFloor(),
      rng
    );
    experiencePointChanges = generateExperiencePoints(party);

    party.inputLock.unlockInput();
  }

  const { actionEntityManager } = party;
  const actionEntitiesRemoved = actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

  const payload: BattleResultActionCommandPayload = {
    type: ActionCommandType.BattleResult,
    conclusion,
    loot: loot,
    partyName: party.name,
    experiencePointChanges,
    actionEntitiesRemoved,
    timestamp: Date.now(),
  };

  const battleConclusionActionCommand = new ActionCommand(
    game.name,
    payload,
    gameEventCommandReceiver
  );

  return { payload, command: battleConclusionActionCommand };
}
