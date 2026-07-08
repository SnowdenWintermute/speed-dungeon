import { IActionUser } from "../action-user-context/action-user.js";
import { HALF_KILL_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS } from "../combat/combat-actions/action-implementations/death/half-kill.js";
import { DEATH_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS } from "../combat/combat-actions/action-implementations/death/index.js";
import { ResourceChangePropertiesStrategy } from "../combat/combat-actions/action-implementations/resource-change-properties-strategy.js";
import { CombatActionResource } from "../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../combat/hp-change-source-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { NumberRange } from "../primatives/number-range.js";
import { ResourceChangePropertiesGetters } from "../types.js";

export class TestResourceChangePropertiesStrategy extends ResourceChangePropertiesStrategy {
  constructor(
    private getters: Record<
      CombatActionName,
      ResourceChangePropertiesGetters
    > = TEST_RESOURCE_CHANGE_PROPERTIES_GETTERS
  ) {
    super();
  }

  getResourceChangePropertiesGetters(
    actionName: CombatActionName
  ): ResourceChangePropertiesGetters {
    return this.getters[actionName];
  }
}

const ONE_PHYSICAL_DAMAGE = {
  [CombatActionResource.HitPoints]: () => {
    return {
      resourceChangeSource: new ResourceChangeSource({
        category: ResourceChangeSourceCategory.Physical,
      }),
      baseValues: new NumberRange(1, 1),
    };
  },
};

const ONE_MEDICAL_HEALING = {
  [CombatActionResource.HitPoints]: () => {
    return {
      resourceChangeSource: new ResourceChangeSource({
        category: ResourceChangeSourceCategory.Magical,
        isHealing: true,
      }),
      baseValues: new NumberRange(1, 1),
    };
  },
};

const ONE_MEDICAL_MANA_RESTORE = {
  [CombatActionResource.Mana]: () => {
    return {
      resourceChangeSource: new ResourceChangeSource({
        category: ResourceChangeSourceCategory.Magical,
        isHealing: true,
      }),
      baseValues: new NumberRange(1, 1),
    };
  },
};

const ONE_ELEMENTAL_MAGIC_DAMAGE = (magicalElement: MagicalElement) => {
  return {
    [CombatActionResource.HitPoints]: () => {
      return {
        resourceChangeSource: new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Magical,
        }),
        magicalElement,
        baseValues: new NumberRange(1, 1),
      };
    },
  };
};

const ONE_ELEMENTAL_KINETIC_DAMAGE = (magicalElement: MagicalElement) => {
  return {
    [CombatActionResource.HitPoints]: () => {
      return {
        resourceChangeSource: new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Physical,
        }),
        magicalElement,
        baseValues: new NumberRange(1, 1),
      };
    },
  };
};

const ONE_ELEMENTAL_MAGIC_HEALING = (magicalElement: MagicalElement) => {
  return {
    [CombatActionResource.HitPoints]: () => {
      return {
        resourceChangeSource: new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Magical,
          isHealing: true,
        }),
        magicalElement,
        baseValues: new NumberRange(1, 1),
      };
    },
  };
};

const PROJECTILE_COPY_PARENT = {
  [CombatActionResource.HitPoints]: (user: IActionUser) => {
    const resourceChangeProperties =
      user.getActionEntityProperties().actionOriginData?.resourceChangeProperties?.[
        CombatActionResource.HitPoints
      ];

    if (resourceChangeProperties === undefined)
      throw new Error("expected projectile to have stored a resource change properties object");
    return resourceChangeProperties;
  },
};

export const TEST_RESOURCE_CHANGE_PROPERTIES_GETTERS: Record<
  CombatActionName,
  ResourceChangePropertiesGetters
> = {
  [CombatActionName.Attack]: {},
  [CombatActionName.AttackMeleeMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.AttackMeleeOffhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.AttackRangedMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.AttackRangedMainhandProjectile]: PROJECTILE_COPY_PARENT,
  [CombatActionName.CounterAttackRangedMainhandProjectile]: PROJECTILE_COPY_PARENT,
  [CombatActionName.Counterattack]: {},
  [CombatActionName.CounterattackMeleeMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.CounterattackRangedMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.ChainingSplitArrowParent]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.ChainingSplitArrowProjectile]: PROJECTILE_COPY_PARENT,
  [CombatActionName.ExplodingArrowParent]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.ExplodingArrowProjectile]: PROJECTILE_COPY_PARENT,
  [CombatActionName.SpawnExplosion]: {},
  [CombatActionName.ExecuteExplosion]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.IceBoltParent]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Ice),
  [CombatActionName.IceBoltProjectile]: PROJECTILE_COPY_PARENT,
  [CombatActionName.IceBurstParent]: {},
  [CombatActionName.IceBurstExplosion]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Ice),
  [CombatActionName.Fire]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.Healing]: ONE_ELEMENTAL_MAGIC_HEALING(MagicalElement.Light),
  [CombatActionName.Blind]: {},
  [CombatActionName.Firewall]: {},
  [CombatActionName.FirewallBurn]: ONE_ELEMENTAL_KINETIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.FirewallPassTurn]: {},
  [CombatActionName.IgniteProjectile]: {},
  [CombatActionName.IncinerateProjectile]: {},
  [CombatActionName.SummonPetParent]: {},
  [CombatActionName.SummonPetAppear]: {},
  [CombatActionName.DismissPet]: {},
  [CombatActionName.TamePet]: {},
  [CombatActionName.ReleasePet]: {},
  [CombatActionName.PetCommand]: {},
  [CombatActionName.Ensnare]: {},
  [CombatActionName.EnsnareMoveNetTowardTargetAndActivate]: {},
  [CombatActionName.BurningTick]: ONE_ELEMENTAL_KINETIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.ConditionPassTurn]: {},
  [CombatActionName.UseGreenAutoinjector]: ONE_MEDICAL_HEALING,
  [CombatActionName.UseBlueAutoinjector]: ONE_MEDICAL_MANA_RESTORE,
  [CombatActionName.ReadSkillBook]: {},
  [CombatActionName.PayActionPoint]: {},
  [CombatActionName.PassTurn]: {},
  [CombatActionName.Death]: DEATH_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS,
  [CombatActionName.Kill]: DEATH_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS, // is copied from Death action in Kill's implementation anyway
  [CombatActionName.HalfKill]: HALF_KILL_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS,
  [CombatActionName.FallTowardsHomePosition]: {},
  [CombatActionName.StartFlying]: {},
  [CombatActionName.Provoke]: {},
};
