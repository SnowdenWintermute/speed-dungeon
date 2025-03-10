import {
  SkeletalAnimationName,
  CombatantProperties,
  ERROR_MESSAGES,
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
  HpChange,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { GameWorld } from "../../game-world";
import startHpChangeFloatingMessage from "./start-hp-change-floating-message";
import getCurrentParty from "@/utils/getCurrentParty";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useUIStore } from "@/stores/ui-store";

export function induceHitRecovery(
  gameWorld: GameWorld,
  actionUserId: string,
  targetId: string,
  hpChange: HpChange,
  wasSpell: boolean,
  wasBlocked: boolean
) {
  const targetModel = gameWorld.modelManager.combatantModels[targetId];
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

  // hpChange.isCrit = true;

  startHpChangeFloatingMessage(targetId, hpChange, wasBlocked, 2000);

  const showDebug = useUIStore.getState().showDebug;

  useGameStore.getState().mutateState((gameState) => {
    // - change their hp
    // - determine if died or resurrected
    // - handle any death by removing the affected combatant's turn tracker
    // - handle any ressurection by adding the affected combatant's turn tracker

    const gameOption = gameState.game;
    if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const game = gameOption;
    if (!gameState.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const partyOptionResult = getCurrentParty(gameState, gameState.username);
    if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
    if (partyOptionResult === undefined)
      return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    const party = partyOptionResult;
    const combatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
    if (combatantResult instanceof Error) return console.error(combatantResult);
    const { combatantProperties } = combatantResult;

    const combatantWasAliveBeforeHpChange = combatantProperties.hitPoints > 0;
    CombatantProperties.changeHitPoints(combatantProperties, hpChange.value);

    const actionUserResult = SpeedDungeonGame.getCombatantById(game, actionUserId);
    if (actionUserResult instanceof Error) return console.error(actionUserResult);

    const elementOption =
      hpChange.source.elementOption !== undefined
        ? MAGICAL_ELEMENT_STRINGS[hpChange.source.elementOption]
        : null;
    const kineticOption =
      hpChange.source.kineticDamageTypeOption !== undefined
        ? KINETIC_DAMAGE_TYPE_STRINGS[hpChange.source.kineticDamageTypeOption]
        : null;

    const hpChangeSourceCategoryText = HP_CHANGE_SOURCE_CATEGORY_STRINGS[hpChange.source.category];

    const damageText = `points of ${hpChangeSourceCategoryText.toLowerCase()}${kineticOption ? ` ${kineticOption.toLowerCase()}` : ""}${elementOption ? ` ${elementOption.toLowerCase()}` : ""} damage`;
    const hpOrDamage = hpChange.value > 0 ? "hit points" : damageText;

    const style = hpChange.value > 0 ? CombatLogMessageStyle.Healing : CombatLogMessageStyle.Basic;
    let messageText = "";

    if (wasSpell) {
      const damagedOrHealed = hpChange.value > 0 ? "recovers" : "takes";
      messageText = `${combatantResult.entityProperties.name} ${damagedOrHealed} ${Math.abs(hpChange.value)} ${hpOrDamage}`;
    } else {
      const damagedOrHealed = hpChange.value > 0 ? "healed" : "hit";

      const isTargetingSelf =
        actionUserResult.entityProperties.id === combatantResult.entityProperties.id;
      const targetNameText = isTargetingSelf ? "themselves" : combatantResult.entityProperties.name;

      const debugTargetId = showDebug ? targetId : "";
      messageText = `${actionUserResult.entityProperties.name} ${damagedOrHealed} ${targetNameText} ${debugTargetId} for ${Math.abs(hpChange.value)} ${hpOrDamage}`;
    }

    if (hpChange.isCrit) messageText = "Critical! " + messageText;
    if (wasBlocked) messageText = "Shield block: " + messageText;

    gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));

    if (combatantProperties.hitPoints <= 0) {
      const maybeError = SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);
      if (maybeError instanceof Error) return console.error(maybeError);

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatantResult.entityProperties.name}'s hp was reduced to zero`,
          CombatLogMessageStyle.Basic
        )
      );

      targetModel.animationManager.startAnimationWithTransition(SkeletalAnimationName.Death, 0, {
        shouldLoop: false,
        animationDurationOverrideOption: null,
        animationEventOption: null,
        onComplete: () => {
          targetModel.animationManager.locked = true;
        },
      });
    } else if (hpChange.value < 0) {
      const hasCritRecoveryAnimation = targetModel.animationManager.getAnimationGroupByName(
        SkeletalAnimationName.HitRecovery
      );
      let animationName = SkeletalAnimationName.HitRecovery;
      if (hpChange.isCrit && hasCritRecoveryAnimation)
        animationName = SkeletalAnimationName.CritRecovery;
      if (wasBlocked) animationName = SkeletalAnimationName.Block;

      targetModel.animationManager.startAnimationWithTransition(animationName, 0, {
        shouldLoop: false,
        animationDurationOverrideOption: null,
        animationEventOption: null,
        onComplete: () => {},
      });
    }

    if (!combatantWasAliveBeforeHpChange && combatantProperties.hitPoints > 0) {
      targetModel.startIdleAnimation(500);
      // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
    }
  });
}
