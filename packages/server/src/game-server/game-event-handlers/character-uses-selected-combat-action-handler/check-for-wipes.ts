import { AdventuringParty, Combatant } from "@speed-dungeon/common";

export interface PartyWipes {
  alliesDefeated: boolean;
  opponentsDefeated: boolean;
}

export function checkForWipes(party: AdventuringParty, battleIdOption: null | string): PartyWipes {
  // IF NOT IN BATTLE AND SOMEHOW WIPED OWN PARTY
  if (battleIdOption === null) {
    const partyMemberCombatants = party.combatantManager.getPartyMemberCombatants();

    const alliesDefeated = Combatant.groupIsDead(partyMemberCombatants);

    return {
      alliesDefeated,
      opponentsDefeated: false,
    };
  }

  // MORE LIKELY, IN BATTLE
  const partyCombatants = party.combatantManager.getPartyMemberCombatants();
  const dungeonControlledCombatants = party.combatantManager.getDungeonControlledCombatants();

  const partyWipesResult = checkForDefeatedCombatantGroups(
    partyCombatants,
    dungeonControlledCombatants
  );
  if (partyWipesResult instanceof Error) throw partyWipesResult;

  return partyWipesResult;
}

function checkForDefeatedCombatantGroups(
  allies: Combatant[],
  opponents: Combatant[]
):
  | Error
  | {
      alliesDefeated: boolean;
      opponentsDefeated: boolean;
    } {
  const alliesDefeated = Combatant.groupIsDead(allies);
  const opponentsDefeated = Combatant.groupIsDead(opponents);

  return { alliesDefeated, opponentsDefeated };
}
