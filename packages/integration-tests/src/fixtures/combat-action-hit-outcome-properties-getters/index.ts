import {
  CombatActionName,
  CombatActionResource,
  MagicalElement,
  NumberRange,
  ResourceChangePropertiesGetters,
  ResourceChangePropertiesStrategy,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "@speed-dungeon/common";

export class TestResourceChangePropertiesStrategy extends ResourceChangePropertiesStrategy {
  getResourceChangePropertiesGetters(
    actionName: CombatActionName
  ): ResourceChangePropertiesGetters {
    return TEST_RESOURCE_CHANGE_PROPERTIES_GETTERS[actionName];
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

const TEST_RESOURCE_CHANGE_PROPERTIES_GETTERS: Record<
  CombatActionName,
  ResourceChangePropertiesGetters
> = {
  [CombatActionName.Attack]: {},
  [CombatActionName.AttackMeleeMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.AttackMeleeOffhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.AttackRangedMainhand]: {},
  [CombatActionName.AttackRangedMainhandProjectile]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.CounterAttackRangedMainhandProjectile]: {},
  [CombatActionName.Counterattack]: {},
  [CombatActionName.CounterattackMeleeMainhand]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.CounterattackRangedMainhand]: {},
  [CombatActionName.ChainingSplitArrowParent]: {},
  [CombatActionName.ChainingSplitArrowProjectile]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.ExplodingArrowParent]: {},
  [CombatActionName.ExplodingArrowProjectile]: ONE_PHYSICAL_DAMAGE,
  [CombatActionName.SpawnExplosion]: {},
  [CombatActionName.ExecuteExplosion]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.IceBoltParent]: {},
  [CombatActionName.IceBoltProjectile]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Ice),
  [CombatActionName.IceBurstParent]: {},
  [CombatActionName.IceBurstExplosion]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Ice),
  [CombatActionName.Fire]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.Healing]: ONE_ELEMENTAL_MAGIC_HEALING(MagicalElement.Light),
  [CombatActionName.Blind]: {},
  [CombatActionName.Firewall]: {},
  [CombatActionName.FirewallBurn]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
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
  [CombatActionName.BurningTick]: ONE_ELEMENTAL_MAGIC_DAMAGE(MagicalElement.Fire),
  [CombatActionName.ConditionPassTurn]: {},
  [CombatActionName.UseGreenAutoinjector]: ONE_MEDICAL_HEALING,
  [CombatActionName.UseBlueAutoinjector]: ONE_MEDICAL_MANA_RESTORE,
  [CombatActionName.ReadSkillBook]: {},
  [CombatActionName.PayActionPoint]: {},
  [CombatActionName.PassTurn]: {},
  [CombatActionName.Death]: {},
  [CombatActionName.FallTowardsHomePosition]: {},
  [CombatActionName.StartFlying]: {},
};
