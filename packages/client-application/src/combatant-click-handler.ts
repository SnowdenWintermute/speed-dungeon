import { AdventuringParty, CombatantId, Username } from "@speed-dungeon/common";
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

    // @TODO - an action is selected: only show the reticle for combatants that are targetable
    // with it (untargetable combatants aren't clickable and shouldn't show a reticle)
    return true;
  }

  combatantClicked(combatantId: CombatantId) {
    const { gameContext, combatantFocus, session } = this.clientApplication;
    const { partyOption } = gameContext;
    // clicking combatants is only meaningful in the game world (i.e. in a party)
    if (!partyOption) {
      return;
    }

    const focusedCharacter = combatantFocus.focusedCharacterOption;
    const hasActionSelected =
      focusedCharacter?.combatantProperties.targetingProperties.getSelectedActionAndRank() != null;

    if (!hasActionSelected) {
      this.handleClickWithNoActionSelected(combatantId, partyOption, session.requireUsername());
      return;
    }

    // @TODO - an action is selected on the focused character:
    // - clicking the combatant already targeted executes the action (UseSelectedCombatAction);
    //   while hovering that target the cursor should indicate a confirm (crosshair)
    // - clicking a different valid target switches the target to it — needs a direct set-target
    //   intent; today only CycleCombatActionTargets exists
    // - combatants not targetable with the selected action are not clickable and shouldn't show
    //   their reticle at all
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

    // @TODO - clicked a combatant that isn't one of the player's characters (e.g. an enemy in a
    // battle): have the focused character select a default action targeting it. The default is
    // the attack action if owned, but should be context-dependent — if the target has the flying
    // condition and the focused character isn't wielding a ranged weapon, pick a ranged default
    // (e.g. throw pebble), since melee always misses fliers. This wants a shared
    // determineDefaultAction(focusedCharacter, target) used only once we've decided the click
    // should select an action at all.
  }
}
