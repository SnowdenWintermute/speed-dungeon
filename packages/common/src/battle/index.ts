import { BattleResultActionCommandPayload } from "../action-processing/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { FriendOrFoe, TurnOrderManager } from "../combat/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";

export class Battle {
  turnOrderManager: TurnOrderManager;
  constructor(
    public id: EntityId,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ) {
    this.turnOrderManager = new TurnOrderManager(game, party);
    party.combatantManager.refillAllCombatantActionPoints();
  }

  static getDeserialized(battle: Battle, game: SpeedDungeonGame, party: AdventuringParty) {
    return new Battle(battle.id, game, party);
  }

  static invertAllyAndOpponentIds(
    idsByDisposition: Record<FriendOrFoe, EntityId[]>
  ): Record<FriendOrFoe, EntityId[]> {
    return {
      [FriendOrFoe.Hostile]: idsByDisposition[FriendOrFoe.Friendly],
      [FriendOrFoe.Friendly]: idsByDisposition[FriendOrFoe.Hostile],
    };
  }

  /** Returns any levelups by character id  */
  static handleVictory(
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
}

export enum BattleConclusion {
  Defeat,
  Victory,
}
