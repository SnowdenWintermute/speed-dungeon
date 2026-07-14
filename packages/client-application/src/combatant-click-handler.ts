import {
  ActionAndRank,
  ActionUserContext,
  AdventuringParty,
  ClientIntentType,
  CombatActionTargetType,
  CombatantId,
  TargetingCalculator,
  TargetingScheme,
  TargetingSelection,
  Username,
} from "@speed-dungeon/common";
import { ClientApplication } from ".";

export class CombatantClickHandler {
  constructor(private clientApplication: ClientApplication) {}

  // whether a combatant's clickable reticle should be shown — i.e. whether clicking it would do
  // anything meaningful in the current context
  shouldShowReticle(combatantId: CombatantId): boolean {
    const { gameContext, combatantFocus } = this.clientApplication;
    if (!gameContext.partyOption) {
      return false;
    }

    const focusedCharacter = combatantFocus.focusedCharacterOption;
    const hasActionSelected =
      focusedCharacter?.combatantProperties.targetingProperties.getSelectedActionAndRank() != null;

    if (!hasActionSelected) {
      // clicking re-focuses party members or (against an enemy) selects a default action, but
      // clicking the character that is already focused does nothing
      return combatantFocus.focusedCharacterIdOption !== combatantId;
    }

    // an action is selected: only combatants that are a valid target to switch to are clickable
    return this.getTargetingSelectionForClick(combatantId) !== null;
  }

  combatantClicked(combatantId: CombatantId) {
    const { gameContext, combatantFocus, session } = this.clientApplication;
    const { partyOption } = gameContext;
    // clicking combatants is only meaningful in the game world (i.e. in a party)
    if (!partyOption) {
      return;
    }

    const focusedCharacter = combatantFocus.focusedCharacterOption;
    const selectedActionAndRank =
      focusedCharacter?.combatantProperties.targetingProperties.getSelectedActionAndRank() ?? null;

    if (focusedCharacter === undefined || selectedActionAndRank === null) {
      this.handleClickWithNoActionSelected(combatantId, partyOption, session.requireUsername());
      return;
    }

    // an action is selected on the focused character: clicking a valid target switches to it
    const targetingSelection = this.getTargetingSelectionForClick(combatantId);
    if (targetingSelection === null) {
      return;
    }

    const focusedCharacterId = combatantFocus.requireFocusedCharacterId();
    const { targetingProperties, abilityProperties } = focusedCharacter.combatantProperties;

    // when the action was auto-selected for the player by clicking (not chosen in the menu),
    // re-evaluate the best default for the newly clicked target and switch to it if it differs; a
    // deliberately chosen action is respected and only its target changes
    const targetCombatant = partyOption.combatantManager.getCombatantOption(combatantId);
    if (targetingProperties.getSelectedActionWasAutoSelected() && targetCombatant !== undefined) {
      const defaultActionAndRank = abilityProperties.getDefaultActionOnTarget(
        focusedCharacter,
        targetCombatant
      );
      if (defaultActionAndRank.actionName !== selectedActionAndRank.actionName) {
        this.selectDefaultActionOnTarget(focusedCharacterId, defaultActionAndRank, targetingSelection);
        return;
      }
    }

    // @TODO - clicking the combatant already targeted should instead execute the action
    // (UseSelectedCombatAction); while hovering that target the cursor should indicate a confirm
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.SetCombatActionTarget,
      data: {
        characterId: focusedCharacterId,
        targetingSelection,
      },
    });
  }

  private getTargetingSelectionForClick(combatantId: CombatantId): TargetingSelection | null {
    const { gameContext, combatantFocus } = this.clientApplication;
    const focusedCharacterId = combatantFocus.focusedCharacterIdOption;
    if (focusedCharacterId === null) {
      return null;
    }

    const { game, party, combatant } = gameContext.requireCombatantContext(focusedCharacterId);
    const targetingCalculator = new TargetingCalculator(
      new ActionUserContext(game, party, combatant),
      null
    );

    return targetingCalculator.getTargetingSelectionForClickedCombatant(combatantId);
  }

  private handleClickWithNoActionSelected(
    combatantId: CombatantId,
    party: AdventuringParty,
    username: Username
  ) {
    if (party.combatantManager.playerOwnsCharacter(username, combatantId)) {
      // focus your own party member
      this.clientApplication.combatantFocus.setFocusedCharacter(combatantId);
      return;
    }

    // clicked a combatant that isn't one of the player's characters (e.g. an enemy): the focused
    // character selects its default action against that target
    const { combatantFocus } = this.clientApplication;
    const focusedCharacter = combatantFocus.focusedCharacterOption;
    if (focusedCharacter === undefined) {
      return;
    }
    const targetCombatant = party.combatantManager.getCombatantOption(combatantId);
    if (targetCombatant === undefined) {
      return;
    }

    const defaultActionAndRank =
      focusedCharacter.combatantProperties.abilityProperties.getDefaultActionOnTarget(
        focusedCharacter,
        targetCombatant
      );

    const targetingSelection: TargetingSelection = {
      targetingScheme: TargetingScheme.Single,
      target: { type: CombatActionTargetType.Single, targetId: combatantId },
    };

    this.selectDefaultActionOnTarget(
      combatantFocus.requireFocusedCharacterId(),
      defaultActionAndRank,
      targetingSelection
    );
  }

  private selectDefaultActionOnTarget(
    characterId: CombatantId,
    defaultActionAndRank: ActionAndRank,
    targetingSelection: TargetingSelection
  ) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.SelectCombatAction,
      data: {
        characterId,
        actionAndRankOption: defaultActionAndRank.toSerialized(),
        targetingSelectionOption: targetingSelection,
        autoSelected: true,
      },
    });
  }
}
