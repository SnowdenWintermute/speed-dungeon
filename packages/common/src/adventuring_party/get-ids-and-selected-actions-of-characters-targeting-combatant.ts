import { AdventuringParty } from ".";

export default function getIdsAndSelectedActionsOfCharactersTargetingCombatant(
  this: AdventuringParty,
  combatantId: string
) {
  const characterPositions = this.characterPositions;
  const monsterPositions = this.getMonsterIds();

  Object.values(this.characters).forEach((character) => {
    const selectedAction = character.combatantProperties.selectedCombatAction;
    if (!selectedAction) return;
    const actionPropertiesResult =
      character.combatantProperties.getPropertiesIfOwned(selectedAction);
    if (actionPropertiesResult instanceof Error) return;
  });
}
