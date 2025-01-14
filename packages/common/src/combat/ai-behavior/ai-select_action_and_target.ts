import { CombatActionTargetType } from "../index.js";
import { BattleGroup } from "../../battle/index.js";
import { AbilityName, Combatant, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { chooseRandomFromArray } from "../../utils/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatAttribute } from "../../attributes/index.js";

export interface AbilityAndTarget {
  abilityName: AbilityName;
  target: CombatActionTarget;
}

export function AISelectActionAndTarget(
  game: SpeedDungeonGame,
  userId: string,
  allyBattleGroup: BattleGroup,
  enemyBattleGroup: BattleGroup
): Error | AbilityAndTarget {
  const randomEnemyTargetResult = getRandomAliveEnemy(game, enemyBattleGroup);
  if (randomEnemyTargetResult instanceof Error) return randomEnemyTargetResult;
  const randomEnemyTarget = randomEnemyTargetResult;

  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;

  const attackAbility: AbilityAndTarget = {
    abilityName: AbilityName.Attack,
    target: {
      type: CombatActionTargetType.Single,
      targetId: randomEnemyTarget.entityProperties.id,
    },
  };

  if (userCombatantProperties.abilities[AbilityName.Fire]) {
    const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
      userCombatantProperties,
      AbilityName.Fire
    );
    if (manaCostResult instanceof Error) return manaCostResult;
    if (userCombatantProperties.mana < manaCostResult) return attackAbility;
    return {
      abilityName: AbilityName.Fire,
      target: { type: CombatActionTargetType.Group, friendOrFoe: FriendOrFoe.Hostile },
    };
  }
  if (userCombatantProperties.abilities[AbilityName.Ice]) {
    const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
      userCombatantProperties,
      AbilityName.Ice
    );
    if (manaCostResult instanceof Error) return manaCostResult;
    if (userCombatantProperties.mana < manaCostResult) return attackAbility;
    return {
      abilityName: AbilityName.Ice,
      target: {
        type: CombatActionTargetType.Single,
        targetId: randomEnemyTarget.entityProperties.id,
      },
    };
  }
  if (userCombatantProperties.abilities[AbilityName.Healing]) {
    let alliesDamaged = [];
    for (const allyId of allyBattleGroup.combatantIds) {
      const allyCombatantResult = SpeedDungeonGame.getCombatantById(game, allyId);
      if (!(allyCombatantResult instanceof Error)) {
        const allyHpMax = CombatantProperties.getTotalAttributes(
          allyCombatantResult.combatantProperties
        )[CombatAttribute.Hp];
        if (
          allyCombatantResult.combatantProperties.hitPoints < allyHpMax &&
          allyCombatantResult.combatantProperties.hitPoints !== 0
        ) {
          alliesDamaged.push(allyCombatantResult.entityProperties.id);
        }
      }
    }
    if (alliesDamaged) {
      const manaCostResult = CombatantProperties.getAbilityCostIfOwned(
        userCombatantProperties,
        AbilityName.Healing
      );
      if (manaCostResult instanceof Error) return manaCostResult;
      if (userCombatantProperties.mana < manaCostResult) return attackAbility;

      if (alliesDamaged.length > 1)
        return {
          abilityName: AbilityName.Healing,
          target: { type: CombatActionTargetType.Group, friendOrFoe: FriendOrFoe.Friendly },
        };
      else if (alliesDamaged[0])
        return {
          abilityName: AbilityName.Healing,
          target: { type: CombatActionTargetType.Single, targetId: alliesDamaged[0] },
        };
    } else return attackAbility;
  }

  return attackAbility;
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
