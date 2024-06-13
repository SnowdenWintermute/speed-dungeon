import { Battle, CombatTurnResult, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function takeAiControlledTurnsIfAppropriate(game: SpeedDungeonGame, battle: Battle) {
  const turnResults: CombatTurnResult[] = [];
  const { turnTrackers } = battle;
  const activeCombatantTrackerOption = turnTrackers[0];
  if (!activeCombatantTrackerOption) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  const activeCombatantId = activeCombatantTrackerOption.entityId;
  const activeCombatantResult = SpeedDungeonGame.getCombatantById(game, activeCombatantId);
  if (activeCombatantResult instanceof Error) return activeCombatantResult;
  const { entityProperties, combatantProperties } = activeCombatantResult;
  let activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
  const activeCombatantTurnActionResults = [];

  while (activeCombatantIsAiControlled) {
    //
  }
}
