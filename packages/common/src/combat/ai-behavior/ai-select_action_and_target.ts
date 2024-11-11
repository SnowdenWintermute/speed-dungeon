import { CombatActionTargetType, FriendOrFoe } from "../index.js";
import { BattleGroup } from "../../battle/index.js";
import {
  CombatantAbilityName,
  Combatant,
  CombatantProperties,
} from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { chooseRandomFromArray } from "../../utils/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";

export interface AbilityAndTarget {
  abilityName: CombatantAbilityName;
  target: CombatActionTarget;
}

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  userId: string,
  _allyBattleGroup: BattleGroup,
  enemyBattleGroup: BattleGroup
): Error | AbilityAndTarget {
  const randomEnemyTargetResult = getRandomAliveEnemy(game, enemyBattleGroup);
  if (randomEnemyTargetResult instanceof Error) return randomEnemyTargetResult;
  const randomEnemyTarget = randomEnemyTargetResult;

  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;

  if (userCombatantProperties.abilities[CombatantAbilityName.Fire]) {
    const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
      userCombatantProperties,
      CombatantAbilityName.Fire
    );
    if (manaCostResult instanceof Error) return manaCostResult;
    return {
      abilityName: CombatantAbilityName.Fire,
      target: { type: CombatActionTargetType.Group, friendOrFoe: FriendOrFoe.Hostile },
    };
  }
  if (userCombatantProperties.abilities[CombatantAbilityName.Ice]) {
    const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
      userCombatantProperties,
      CombatantAbilityName.Ice
    );
    if (manaCostResult instanceof Error) return manaCostResult;
    return {
      abilityName: CombatantAbilityName.Ice,
      target: {
        type: CombatActionTargetType.Single,
        targetId: randomEnemyTarget.entityProperties.id,
      },
    };
  }
  if (userCombatantProperties.abilities[CombatantAbilityName.Healing]) {
    const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
      userCombatantProperties,
      CombatantAbilityName.Healing
    );
    if (manaCostResult instanceof Error) return manaCostResult;
    return {
      abilityName: CombatantAbilityName.Healing,
      target: { type: CombatActionTargetType.Group, friendOrFoe: FriendOrFoe.Friendly },
    };
  }

  return {
    abilityName: CombatantAbilityName.Attack,
    target: {
      type: CombatActionTargetType.Single,
      targetId: randomEnemyTarget.entityProperties.id,
    },
  };
}

function getRandomAliveEnemy(
  game: SpeedDungeonGame,
  enemyBattleGroup: BattleGroup
): Error | Combatant {
  const idsOfAliveTargets = [];
  for (const enemyId of enemyBattleGroup.combatantIds) {
    let combatantResult = SpeedDungeonGame.getCombatantById(game, enemyId);
    if (combatantResult instanceof Error) return combatantResult;
    if (combatantResult.combatantProperties.hitPoints > 0) idsOfAliveTargets.push(enemyId);
  }
  if (idsOfAliveTargets.length === 0) return new Error("No alive targets");
  const randomTargetIdResult = chooseRandomFromArray(idsOfAliveTargets);
  if (randomTargetIdResult instanceof Error) return randomTargetIdResult;

  return SpeedDungeonGame.getCombatantById(game, randomTargetIdResult);
}
