import { CombatantProperties } from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionHpChangeProperties } from "../../combat-actions";
import { MeleeOrRanged } from "../../hp-change-source-types";

export default function calculatePhysicalDamageHpChanges(
  game: SpeedDungeonGame,
  meleeOrRanged: MeleeOrRanged,
  userCombatantProperties: CombatantProperties,
  idsOfNonEvadingTargets: string[],
  incomingDamagePerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
) {
  const hitPointChanges: { [entityId: string]: number } = {};
  for (const targetId of idsOfNonEvadingTargets) {
    //
  }
}
