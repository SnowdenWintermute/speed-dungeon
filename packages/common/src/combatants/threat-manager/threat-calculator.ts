import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBATANT_MAX_LEVEL } from "../../app-consts.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { CombatAttribute } from "../attributes/index.js";
import { Combatant, CombatantProperties } from "../index.js";
import { STABLE_THREAT_CAP, ThreatType } from "./index.js";

const DAMAGE_DEALT_STABLE_THREAT_MODIFIER = 4;
const DAMAGE_DEALT_VOLATILE_THREAT_MODIFIER = DAMAGE_DEALT_STABLE_THREAT_MODIFIER * 3;

const MINIMUM_THREAT_LEVEL_MODIFIER = 1 - (COMBATANT_MAX_LEVEL - 1) / COMBATANT_MAX_LEVEL;

const HEALING_STABLE_THREAT_MODIFIER = 1;
const HEALING_VOLATILE_THREAT_MODIFIER = HEALING_STABLE_THREAT_MODIFIER * 6;

const STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER = Math.floor(STABLE_THREAT_CAP / 5.55);

export class ThreatCalculator {
  constructor(
    private threatChanges: ThreatChanges,
    private hitOutcomes: CombatActionHitOutcomes,
    private party: AdventuringParty,
    private actionUser: Combatant,
    private monsters: {
      [entityId: string]: Combatant;
    },
    private players: {
      [entityId: string]: Combatant;
    }
  ) {}

  updateThreatChangesForPlayerControlledCharacterHitOutcomes() {
    if (!this.hitOutcomes.hitPointChanges) return;

    for (const [entityId, hitPointChange] of this.hitOutcomes.hitPointChanges.getRecords()) {
      const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;
      const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;

      if (targetCombatantResult.combatantProperties.threatManager) {
        this.addThreatDamageDealtByPlayerCharacter(
          targetCombatantResult,
          this.actionUser,
          hitPointChange.value
        );
      } else if (targetIsPlayer) {
        this.addThreatFromHealingPlayerCharacter(
          this.monsters,
          this.actionUser,
          hitPointChange.value
        );
      }
    }
  }

  updateThreatChangesForMonsterHitOutcomes() {
    if (
      !this.hitOutcomes.hitPointChanges ||
      Object.values(this.hitOutcomes.hitPointChanges).length === 0
    )
      return;
    for (const [entityId, hitPointChange] of this.hitOutcomes.hitPointChanges.getRecords()) {
      if (hitPointChange.value > 0) continue; // don't add threat for monsters healing players
      const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;
      const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;
      if (!targetIsPlayer) continue;

      const targetMaxHp = CombatantProperties.getTotalAttributes(
        targetCombatantResult.combatantProperties
      )[CombatAttribute.Hp];
      const stableThreatChange = Math.floor(
        (STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER * hitPointChange.value) / targetMaxHp
      );

      this.threatChanges.addOrUpdateEntry(
        this.actionUser.entityProperties.id,
        entityId,
        ThreatType.Stable,
        Math.min(-1, stableThreatChange) // all monster actions should at least reduce ST by 1
      );
    }
  }

  addThreatDamageDealtByPlayerCharacter(
    monster: Combatant,
    playerCharacter: Combatant,
    hpChangeValue: number
  ) {
    const targetLevelPercentOfMaxLevel = monster.combatantProperties.level / COMBATANT_MAX_LEVEL;
    const targetLevelThreatModifier = Math.max(
      MINIMUM_THREAT_LEVEL_MODIFIER,
      1 - targetLevelPercentOfMaxLevel
    );
    const stableThreatModifier = DAMAGE_DEALT_STABLE_THREAT_MODIFIER * targetLevelThreatModifier;
    const stableThreatGenerated = Math.floor(hpChangeValue * stableThreatModifier * -1);

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Stable,
      stableThreatGenerated
    );

    const volatileThreatModifier =
      DAMAGE_DEALT_VOLATILE_THREAT_MODIFIER * targetLevelThreatModifier;

    const volatileThreatGenerated = Math.floor(hpChangeValue * volatileThreatModifier * -1);

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Volatile,
      volatileThreatGenerated
    );
  }

  addThreatFromHealingPlayerCharacter(
    monsters: {
      [entityId: string]: Combatant;
    },
    user: Combatant,
    hpChangeValue: number
  ) {
    for (const [monsterId, monster] of Object.entries(monsters)) {
      if (!monster.combatantProperties.threatManager) continue;
      const targetLevelPercentOfMaxLevel = monster.combatantProperties.level / COMBATANT_MAX_LEVEL;
      const targetLevelThreatModifier = Math.max(
        MINIMUM_THREAT_LEVEL_MODIFIER,
        1 - targetLevelPercentOfMaxLevel
      );
      const stableThreatModifier = HEALING_STABLE_THREAT_MODIFIER * targetLevelThreatModifier;
      const stableThreatGenerated = Math.floor(hpChangeValue * stableThreatModifier);

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Stable,
        stableThreatGenerated
      );

      const volatileThreatModifier = HEALING_VOLATILE_THREAT_MODIFIER * targetLevelThreatModifier;

      const volatileThreatGenerated = Math.floor(hpChangeValue * volatileThreatModifier);

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Volatile,
        volatileThreatGenerated
      );
    }
  }
}
