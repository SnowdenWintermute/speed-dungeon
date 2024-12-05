import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { WeaponSlot } from "../../../items/index.js";
import { KineticDamageType } from "../../kinetic-damage-types.js";

export default function getMostDamagingWeaponKineticDamageTypeOnTarget(
  game: SpeedDungeonGame,
  weaponSlot: WeaponSlot,
  userCombatantProperties: CombatantProperties,
  targetId: string
): Error | null | KineticDamageType {
  const weaponOption = CombatantProperties.getEquippedWeapon(userCombatantProperties, weaponSlot);
  if (!weaponOption) return KineticDamageType.Blunt; // fists are blunt weapons

  const weaponProperties = weaponOption;

  const damageTypesToSelectFrom: KineticDamageType[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification) {
    if (hpChangeSource.kineticDamageTypeOption !== undefined)
      damageTypesToSelectFrom.push(hpChangeSource.kineticDamageTypeOption);
  }

  console.log("selecting from damage types: ", damageTypesToSelectFrom);

  const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
  if (targetCombatantResult instanceof Error) return targetCombatantResult;
  const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
  const targetAffinities =
    CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(targetCombatantProperties);
  let weakestAffinityOption: null | [KineticDamageType, number] = null;
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
