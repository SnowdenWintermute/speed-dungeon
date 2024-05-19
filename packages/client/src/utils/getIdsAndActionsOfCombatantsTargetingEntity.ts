import { AdventuringParty, CombatAction, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getIdsAndActionsOfCombatantsTargetingEntity(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  combatantId: string
) {
  let toReturn: [string, CombatAction][] = [];

  Object.entries(party.characters).forEach(([characterId, character]) => {
    if (character.combatantProperties.selectedCombatAction) {
      //
    }
  });
}
