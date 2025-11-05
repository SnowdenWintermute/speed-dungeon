import { AdventuringParty, Combatant, CombatantClass } from "@speed-dungeon/common";
import Axe from "../../public/img/combatant-class-icons/axe.svg";
import DualSwords from "../../public/img/combatant-class-icons/dual-swords.svg";
import StaffWithSnowflake from "../../public/img/combatant-class-icons/staff-with-snowflake.svg";

export function getCombatantClassIcon(
  combatantClass: CombatantClass,
  fillColorClass: string,
  strokeColorClass: string
) {
  switch (combatantClass) {
    case CombatantClass.Warrior:
      return <Axe className={`h-full ${fillColorClass}`} />;
    case CombatantClass.Mage:
      return <StaffWithSnowflake className={`h-full ${fillColorClass}`} />;
    case CombatantClass.Rogue:
      return <DualSwords className={`h-full ${fillColorClass} ${strokeColorClass}`} />;
  }
}

export function getCombatantUiIdentifier(party: AdventuringParty, combatant: Combatant) {
  const characterPositions = party.combatantManager.sortCombatantIdsLeftToRight(
    party.combatantManager.getPartyMemberCharacters().map((combatant) => combatant.getEntityId())
  );

  const playerPosition = characterPositions.indexOf(combatant.entityProperties.id);
  if (playerPosition !== -1) return { isPlayer: true, position: playerPosition };

  // const playerPetPosition = party.characterPetPositions.indexOf(combatant.entityProperties.id);
  // if (playerPetPosition !== -1) return { isPlayer: false, position: playerPetPosition };

  const monsterPositions = party.combatantManager.sortCombatantIdsLeftToRight(
    party.combatantManager
      .getDungeonControlledCombatants()
      .map((combatant) => combatant.getEntityId())
  );

  const monsterPosition = monsterPositions.indexOf(combatant.entityProperties.id);
  if (monsterPosition !== -1) return { isPlayer: false, position: monsterPosition };

  throw new Error("combatant not in this party so no ui identifier can be assigned");
}

export function getCombatantUiIdentifierIcon(party: AdventuringParty, combatant: Combatant) {
  const combatantUiIdentifier = getCombatantUiIdentifier(party, combatant);
  // const classIcon = getCombatantClassIcon(
  //   combatant.combatantProperties.combatantClass,
  //   "fill-slate-400",
  //   "stroke-slate-400"
  // );
  const letterToDisplay = combatantUiIdentifier.isPlayer ? "C" : "M";
  return (
    <div className="h-full w-full relative">
      <div className="text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <span className="leading-tight">
          {letterToDisplay}
          {combatantUiIdentifier.position + 1}
        </span>
      </div>
    </div>
  );
}
