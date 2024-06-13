import { Battle } from "../../battle";
import { CombatantAbilityName } from "../../combatants";
import { SpeedDungeonGame } from "../../game";
import { CombatActionTarget } from "../targeting/combat-action-targets";

export default function getAbilityActionResults(
  game: SpeedDungeonGame,
  userId: string,
  abilityName: CombatantAbilityName,
  abilityTarget: CombatActionTarget,
  battleOption: null | Battle
) {
  //
}
