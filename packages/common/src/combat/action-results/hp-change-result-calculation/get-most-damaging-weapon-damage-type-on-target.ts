import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { WeaponSlot } from "../../../items/index.js";
import { PhysicalDamageType } from "../../hp-change-source-types.js";

export default function getMostDamagingWeaponPhysicalDamageTypeOnTarget(
  game: SpeedDungeonGame,
  weaponSlot: WeaponSlot,
  userCombatantProperties: CombatantProperties,
  targetId: string
): Error | null | PhysicalDamageType {
  const weaponOption = CombatantProperties.getEquippedWeapon(userCombatantProperties, weaponSlot);
  if (!weaponOption) return null;
  const weaponProperties = weaponOption;
  const damageTypesToSelectFrom: PhysicalDamageType[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification) {
    if (hpChangeSource.physicalDamageTypeOption)
      damageTypesToSelectFrom.push(hpChangeSource.physicalDamageTypeOption);
  }
  const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
  if (targetCombatantResult instanceof Error) return targetCombatantResult;
  const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
  const targetAffinities =
    CombatantProperties.getCombatantTotalPhysicalDamageTypeAffinities(targetCombatantProperties);
  let weakestAffinityOption: null | [PhysicalDamageType, number] = null;
  for (const damageType of damageTypesToSelectFrom) {
    const targetAffinityValueOption = targetAffinities[damageType];
    if (targetAffinityValueOption === undefined) continue;
    const targetAffinityValue = targetAffinityValueOption;
    if (weakestAffinityOption === null || targetAffinityValueOption < weakestAffinityOption[1])
      weakestAffinityOption = [damageType, targetAffinityValue];
  }
  if (weakestAffinityOption !== null) return weakestAffinityOption[0];
  return null;
}
