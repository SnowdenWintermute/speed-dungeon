import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
} from "../../index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { COUNTER_ATTACK_MELEE_MAIN_HAND } from "./counter-attack-melee-main-hand.js";
import { COUNTER_ATTACK_RANGED_MAIN_HAND } from "./counter-attack-ranged-main-hand.js";
import cloneDeep from "lodash.clonedeep";
import { ATTACK_CONFIG } from "../attack/index.js";

const clonedConfig = cloneDeep(ATTACK_CONFIG);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Cancel an incoming attack and respond with one of your own",
  costProperties: { ...clonedConfig.costProperties, costBases: {} },
  hierarchyProperties: {
    ...clonedConfig.hierarchyProperties,
    getChildren: function (context: ActionResolutionStepContext): CombatActionComponent[] {
      const toReturn: CombatActionComponent[] = [];
      const user = context.combatantContext.combatant.combatantProperties;

      if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(user)) {
        toReturn.push(COUNTER_ATTACK_RANGED_MAIN_HAND);
      } else {
        toReturn.push(COUNTER_ATTACK_MELEE_MAIN_HAND);
      }
      return toReturn;
    },
  },
};

export const COUNTER_ATTACK = new CombatActionComposite(CombatActionName.Counterattack, config);
