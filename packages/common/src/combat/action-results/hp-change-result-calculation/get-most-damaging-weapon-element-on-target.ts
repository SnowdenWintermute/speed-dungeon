import { CombatantProperties } from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { WeaponSlot } from "../../../items";
import { MagicalElement } from "../../magical-elements";

export default function getMostDamagingWeaponElementOnTarget(
  game: SpeedDungeonGame,
  weaponSlot: WeaponSlot,
  userCombatantProperties: CombatantProperties,
  targetId: string
): Error | null | MagicalElement {
  const weaponOption = CombatantProperties.getEquippedWeapon(userCombatantProperties, weaponSlot);
  if (!weaponOption) return null;
  const [weaponProperties, equipmentTraits] = weaponOption;

  const elementsToSelectFrom: MagicalElement[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification) {
    if (hpChangeSource.elementOption) elementsToSelectFrom.push(hpChangeSource.elementOption);
  }

  const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
  if (targetCombatantResult instanceof Error) return targetCombatantResult;
  const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
  const targetAffinities =
    CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);

  let weakestAffinityOption: null | [MagicalElement, number] = null;

  for (const element of elementsToSelectFrom) {
    const targetAffinityValueOption = targetAffinities[element];
    if (targetAffinityValueOption === undefined) continue;
    const targetAffinityValue = targetAffinityValueOption;
    if (weakestAffinityOption === null || targetAffinityValueOption < weakestAffinityOption[1])
      weakestAffinityOption = [element, targetAffinityValue];
  }

  if (weakestAffinityOption !== null) return weakestAffinityOption[0];
  return null;
}
