export * from "./player";
export * from "./id-generator";
export * from "./remove-player-from-party";
export * from "./get-player-party";
import { immerable } from "immer";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { EntityId } from "../primatives";
import { IdGenerator } from "./id-generator";
import { SpeedDungeonPlayer } from "./player";
import assignCharacterActionTargets from "../combat/targeting/assign-character-action-targets";
import putPlayerInParty from "./put-player-in-party";
import removePlayerFromParty from "./remove-player-from-party";
import cycleCharacterTargets from "../combat/targeting/cycle-character-targets";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option";
import removePlayerFromGame from "./remove-player-from-game";
import getCharacterInGame from "./get-character-in-game";
import getCombatantInGameById from "./get-combatant-in-game-by-id";
import getPartyOfCombatant from "./get-party-of-combatant";
import applyActionResults from "../combat/action-results/apply-action-results";
import { tickCombatUntilNextCombatantIsActive } from "../combat/turn-order/tick-combat-until-next-combatant-is-active";
import endActiveCombatantTurn from "../combat/turn-order/end-active-combatant-turn";
import allCombatantsInGroupAreDead from "../combat/all-combatants-in-group-are-dead";
import { getPlayerParty } from "./get-player-party";
import cycleCharacterTargetingSchemes from "../combat/targeting/cycle-character-targeting-schemes";
import getActionResults from "../combat/action-results/get-action-results";
import { ERROR_MESSAGES } from "../errors";

export class SpeedDungeonGame {
  [immerable] = true;
  name: string;
  players: { [username: string]: SpeedDungeonPlayer } = {};
  playersReadied: string[] = [];
  adventuringParties: { [partyName: string]: AdventuringParty } = {};
  battles: { [id: EntityId]: Battle } = {};
  timeStarted: null | number = null;
  idGenerator: IdGenerator = new IdGenerator();
  constructor(name: string) {
    this.name = name;
  }

  static removePlayerFromParty = removePlayerFromParty;
  static removePlayer = removePlayerFromGame;
  static putPlayerInParty = putPlayerInParty;
  static getCharacter = getCharacterInGame;
  static getCombatantById = getCombatantInGameById;
  static assignCharacterActionTargets = assignCharacterActionTargets;
  static cycleCharacterTargets = cycleCharacterTargets;
  static cycleCharacterTargetingSchemes = cycleCharacterTargetingSchemes;
  static getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
  static getPartyOfCombatant = getPartyOfCombatant;
  static getPlayerParty = getPlayerParty;
  static getActionResults = getActionResults;
  static applyActionResults = applyActionResults;
  static tickCombatUntilNextCombatantIsActive = tickCombatUntilNextCombatantIsActive;
  static endActiveCombatantTurn = endActiveCombatantTurn;
  static allCombatantsInGroupAreDead = allCombatantsInGroupAreDead;
  static handlePlayerDeath(
    game: SpeedDungeonGame,
    battleIdOption: null | string,
    combatantId: string
  ) {
    if (battleIdOption === null) return;
    // - handle any death by removing the affected combatant's turn tracker
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    const battle = battleOption;
    let indexToRemoveOption = null;
    battle.turnTrackers.forEach((turnTracker, i) => {
      if (turnTracker.entityId === combatantId) {
        indexToRemoveOption = i;
      }
    });
    if (indexToRemoveOption !== null) battle.turnTrackers.splice(indexToRemoveOption, 1);
  }
}
