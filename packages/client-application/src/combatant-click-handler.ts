import {
  ActionAndRank,
  ActionUserContext,
  AdventuringParty,
  ClientIntentType,
  CombatActionTargetType,
  Combatant,
  CombatantId,
  TargetingCalculator,
  TargetingScheme,
  TargetingSelection,
  Username,
} from "@speed-dungeon/common";
import { ClientApplication } from ".";

export class CombatantClickHandler {
  constructor(private clientApplication: ClientApplication) {}

  // cached per-combatant reticle clickability, recomputed by synchronizeReticleClickability() only
  // on the state changes that affect it, so the per-frame disc render just reads the cached value
  private reticleClickabilityByCombatantId = new Map<CombatantId, boolean>();

  reticleIsClickable(combatantId: CombatantId): boolean {
    // no reticles while input is locked (e.g. right after executing an action, during its replay).
    // Checked at read time rather than baked into the cache so lock/unlock is reflected immediately
    // without needing a synchronize call.
    const { partyOption } = this.clientApplication.gameContext;
    if (partyOption === undefined || partyOption.inputLock.isLocked()) {
      return false;
    }

    // lazily compute on a cache miss so a combatant that appeared without a synchronize call (e.g.
    // a spawn path we don't explicitly hook) is still correct on its first render
    const cached = this.reticleClickabilityByCombatantId.get(combatantId);
    if (cached !== undefined) {
      return cached;
    }
    const computed = this.computeReticleIsClickable(combatantId);
    this.reticleClickabilityByCombatantId.set(combatantId, computed);
    return computed;
  }

  // the CSS cursor to show while hovering a combatant's reticle: crosshair when a click would
  // execute the selected action (the combatant is among the current targets — a single target or a
  // member of a targeted group), pointer otherwise (a click that focuses / selects / switches)
  reticleCursor(combatantId: CombatantId): string {
    const targetingCalculator = this.getFocusedCharacterTargetingCalculator();
    if (
      targetingCalculator !== null &&
      targetingCalculator.combatantIsAmongSelectedTargets(combatantId)
    ) {
      return "crosshair";
    }
    return "pointer";
  }

  // recompute every combatant's clickability from scratch; called on the state changes that affect
  // it, and drops entries for combatants that no longer exist
  synchronizeReticleClickability() {
    const updated = new Map<CombatantId, boolean>();
    const { partyOption } = this.clientApplication.gameContext;
    if (partyOption !== undefined) {
      for (const [combatantId] of partyOption.combatantManager.getAllCombatants()) {
        updated.set(combatantId, this.computeReticleIsClickable(combatantId));
      }
    }
    this.reticleClickabilityByCombatantId = updated;
  }

  // whether clicking a combatant's reticle would do anything meaningful in the current context
  private computeReticleIsClickable(combatantId: CombatantId): boolean {
    const { gameContext, combatantFocus, session } = this.clientApplication;
    const { partyOption } = gameContext;
    if (!partyOption) {
      return false;
    }

    // the combatant may have been removed from the manager (e.g. a monster at end of battle) while
    // its scene entity + disc still exist in the scene and keep polling this per frame until they
    // are disposed; guard so we don't query a combatant that no longer exists
    const combatant = partyOption.combatantManager.getCombatantOption(combatantId);
    if (combatant === undefined) {
      return false;
    }

    const focusedCharacter = combatantFocus.focusedCharacterOption;
    const hasActionSelected =
      focusedCharacter?.combatantProperties.targetingProperties.getSelectedActionAndRank() != null;

    if (hasActionSelected) {
      // an action is selected: only combatants that are a valid target to switch to are clickable
      return this.getTargetingSelectionForClick(combatantId) !== null;
    }

    // no action selected: clicking an owned party member focuses it (even a dead one — you may want
    // to focus a downed ally), except the one already focused
    if (partyOption.combatantManager.playerOwnsCharacter(session.requireUsername(), combatantId)) {
      return combatantFocus.focusedCharacterIdOption !== combatantId;
    }

    // an enemy is only clickable if the focused character's default action can actually target it,
    // so e.g. a dead monster (no valid default-action target) shows no reticle
    if (focusedCharacter === undefined) {
      return false;
    }
    return this.defaultActionCanTargetCombatant(focusedCharacter, combatant);
  }

  private defaultActionCanTargetCombatant(
    focusedCharacter: Combatant,
    targetCombatant: Combatant
  ): boolean {
    const targetingCalculator = this.getFocusedCharacterTargetingCalculator();
    if (targetingCalculator === null) {
      return false;
    }

    const defaultActionAndRank =
      focusedCharacter.combatantProperties.abilityProperties.getDefaultActionOnTarget(
        focusedCharacter,
        targetCombatant
      );
    const validIdsByDisposition =
      targetingCalculator.getFilteredPotentialTargetIdsForAction(defaultActionAndRank);
    const targetId = targetCombatant.getEntityId();
    return Object.values(validIdsByDisposition).some((ids) => ids.includes(targetId));
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

    // an action is selected on the focused character
    const targetingCalculator = this.getFocusedCharacterTargetingCalculator();
    if (targetingCalculator === null) {
      return;
    }

    const focusedCharacterId = combatantFocus.requireFocusedCharacterId();

    // clicking a combatant already among the selected targets (a single target, or any member of a
    // targeted group) executes the selected action
    if (targetingCalculator.combatantIsAmongSelectedTargets(combatantId)) {
      this.clientApplication.gameClientRef.get().dispatchIntent({
        type: ClientIntentType.UseSelectedCombatAction,
        data: { characterId: focusedCharacterId },
      });
      // run the same post-execute cleanup as the menu's Execute button: clears the considering-menu
      // stack (so updateFocusedCharacterOnNewTurnOrder can refocus the next active combatant) and
      // deselects the action (so a later click re-enters the select→confirm flow instead of
      // immediately re-executing a leftover selection)
      this.clientApplication.actionMenu.onExecuteAction();
      return;
    }

    // otherwise the click switches to that target, if it is a valid one to switch to
    const targetingSelection =
      targetingCalculator.getTargetingSelectionForClickedCombatant(combatantId);
    if (targetingSelection === null) {
      return;
    }

    // when the action was auto-selected for the player by clicking (not chosen in the menu),
    // re-evaluate the best default for the newly clicked target and switch to it if it differs; a
    // deliberately chosen action is respected and only its target changes
    const { targetingProperties, abilityProperties } = focusedCharacter.combatantProperties;
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

    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.SetCombatActionTarget,
      data: {
        characterId: focusedCharacterId,
        targetingSelection,
      },
    });
  }

  private getTargetingSelectionForClick(combatantId: CombatantId): TargetingSelection | null {
    return (
      this.getFocusedCharacterTargetingCalculator()?.getTargetingSelectionForClickedCombatant(
        combatantId
      ) ?? null
    );
  }

  private getFocusedCharacterTargetingCalculator(): TargetingCalculator | null {
    const { gameContext, combatantFocus } = this.clientApplication;
    const focusedCharacterId = combatantFocus.focusedCharacterIdOption;
    if (focusedCharacterId === null) {
      return null;
    }

    const { game, party, combatant } = gameContext.requireCombatantContext(focusedCharacterId);
    return new TargetingCalculator(new ActionUserContext(game, party, combatant), null);
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
