import cloneDeep from "lodash.clonedeep";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatActionName } from "../../combat-action-names.js";
import { BlindedCombatantCondition } from "../../../../combatants/combatant-conditions/blinded.js";
import { ThreatType } from "../../../../combatants/threat-manager/index.js";
import { STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER } from "../../../../combatants/threat-manager/threat-calculator.js";

export const BLIND_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
  flatThreatGeneratedOnHit: { [ThreatType.Stable]: 1, [ThreatType.Volatile]: 300 },
  flatThreatReducedOnMonsterVsPlayerHit: {
    [ThreatType.Stable]: STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER,
    [ThreatType.Volatile]: 0,
  },
  resourceChangePropertiesGetters: {},

  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;

    const spellLevel =
      combatant.combatantProperties.ownedActions[CombatActionName.Blind]?.level || 0;

    const condition = new BlindedCombatantCondition(
      idGenerator.generate(),
      {
        entityProperties: cloneDeep(combatant.entityProperties),
        friendOrFoe: FriendOrFoe.Hostile,
      },
      spellLevel
    );

    return [condition];
  },
};
