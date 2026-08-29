import {
  COMBAT_ACTIONS,
  EquipmentSlotId,
  getAttackActionName,
  getOffhandAttackActionNameOption,
  invariant,
} from "@speed-dungeon/common";
import type {
  ActionRank,
  CombatActionComponent,
  CombatActionName,
  Combatant,
} from "@speed-dungeon/common";

export interface SampledAction {
  action: CombatActionComponent;
  rank: ActionRank;
}

export interface SampledActions {
  /** the one whose landed and critical counts a report quotes */
  primary: SampledAction;
  /** rolled into the same sample's damage with their counts untracked, such as an off hand swing */
  additional: SampledAction[];
}

export enum SampledActionSelectionType {
  WeaponAttacks,
  NamedActions,
}

export type SampledActionSelectionConfig =
  | { type: SampledActionSelectionType.WeaponAttacks }
  | {
      type: SampledActionSelectionType.NamedActions;
      actionNames: CombatActionName[];
      rank: ActionRank;
    };

/** resolved per call: what a combatant holds changes with every equipment the solver tries on */
export type SampledActionSelector = (combatant: Combatant) => SampledActions;

const WEAPON_ATTACK_RANK = 1 as ActionRank;

function selectWeaponAttacks(combatant: Combatant): SampledActions {
  const weapons = combatant.getWeaponsInSlots([EquipmentSlotId.MainHand, EquipmentSlotId.OffHand], {
    usableWeaponsOnly: true,
  });
  const mainHandEquipmentOption = weapons[EquipmentSlotId.MainHand];
  // read from the slot, not from `weapons`: getWeaponsInSlots drops anything that is not a weapon,
  // so a shield is absent there and the isShield check inside would never fire
  const offhandEquipmentOption = combatant
    .getCombatantProperties()
    .equipment.getEquipmentInSlot(EquipmentSlotId.OffHand);

  const mainHandAttackActionName = getAttackActionName(mainHandEquipmentOption?.weaponProperties, {
    isOffHand: false,
  });
  const offhandAttackActionNameOption = getOffhandAttackActionNameOption(
    mainHandEquipmentOption?.equipment,
    offhandEquipmentOption ?? undefined
  );

  return {
    primary: { action: COMBAT_ACTIONS[mainHandAttackActionName], rank: WEAPON_ATTACK_RANK },
    additional:
      offhandAttackActionNameOption === null
        ? []
        : [{ action: COMBAT_ACTIONS[offhandAttackActionNameOption], rank: WEAPON_ATTACK_RANK }],
  };
}

export function selectSampledActions(config: SampledActionSelectionConfig): SampledActionSelector {
  switch (config.type) {
    case SampledActionSelectionType.WeaponAttacks:
      return selectWeaponAttacks;
    case SampledActionSelectionType.NamedActions: {
      const [primaryActionName, ...additionalActionNames] = config.actionNames;
      invariant(primaryActionName !== undefined, "a named action selection needs an action");
      const { rank } = config;
      // nothing here reads the combatant, so the actions resolve once rather than per sample
      const selected: SampledActions = {
        primary: { action: COMBAT_ACTIONS[primaryActionName], rank },
        additional: additionalActionNames.map((actionName) => ({
          action: COMBAT_ACTIONS[actionName],
          rank,
        })),
      };
      return () => selected;
    }
  }
}
