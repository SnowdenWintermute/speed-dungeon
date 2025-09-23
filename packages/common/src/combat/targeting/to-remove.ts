// @TODO -delete these old references
//
// getUpdatedTargetPreferences(
//   combatAction: CombatActionComponent,
//   newTargets: CombatActionTarget,
//   allyIdsOption: null | string[],
//   opponentIdsOption: null | string[]
// ) {
//   if (!this.playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
//   const newPreferences = cloneDeep(this.playerOption.targetPreferences);
//   const { targetingProperties } = combatAction;

//   const { selectedActionLevel } = this.context.combatant.combatantProperties;
//   if (selectedActionLevel === null)
//     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

//   const targetingSchemes = targetingProperties.getTargetingSchemes(selectedActionLevel);

//   switch (newTargets.type) {
//     case CombatActionTargetType.Single:
//       const { targetId } = newTargets;
//       const isOpponentId = !!opponentIdsOption?.includes(targetId);
//       if (isOpponentId) {
//         newPreferences.hostileSingle = targetId;
//         newPreferences.category = FriendOrFoe.Hostile;
//       } else if (allyIdsOption?.includes(targetId)) {
//         newPreferences.friendlySingle = targetId;
//         newPreferences.category = FriendOrFoe.Friendly;
//       }
//       break;
//     case CombatActionTargetType.Group:
//       const category = newTargets.friendOrFoe;
//       if (targetingSchemes.length > 1) {
//         newPreferences.category = category;
//         newPreferences.targetingSchemePreference = TargetingScheme.Area;
//       } else {
//         // if they had no choice in targeting schemes, don't update their preference
//       }
//       break;
//     case CombatActionTargetType.All:
//       if (targetingSchemes.length > 1)
//         newPreferences.targetingSchemePreference = TargetingScheme.All;
//   }

//   return newPreferences;
// }
//
// cycleCharacterTargets(
//   characterId: string,
//   direction: NextOrPrevious
// ): Error | CombatActionTarget {
//   // if (this.playerOption === null) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
//   const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
//     this.context.party,
//     characterId
//   );

//   if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
//   const { character, combatAction, currentTarget } = characterAndActionDataResult;

//   const { selectedActionLevel } = character.combatantProperties;
//   if (selectedActionLevel === null)
//     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

//   const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(
//     combatAction,
//     selectedActionLevel
//   );
//   if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
//   const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

//   const newTargetsResult = getNextOrPreviousTarget(
//     combatAction,
//     selectedActionLevel,
//     currentTarget,
//     direction,
//     characterId,
//     allyIdsOption,
//     opponentIdsOption
//   );
//   if (newTargetsResult instanceof Error) return newTargetsResult;

//   if (this.playerOption) {
//     const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
//       combatAction,
//       newTargetsResult,
//       allyIdsOption,
//       opponentIdsOption
//     );
//     if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

//     this.playerOption.targetPreferences = updatedTargetPreferenceResult;
//   }
//   character.combatantProperties.combatActionTarget = newTargetsResult;

//   return newTargetsResult;
// }

// cycleCharacterTargetingSchemes(characterId: string): Error | CombatActionTarget {
//   const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
//     this.context.party,
//     characterId
//   );
//   if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
//   const { character, combatAction } = characterAndActionDataResult;
//   const { targetingProperties } = combatAction;

//   const { selectedActionLevel } = character.combatantProperties;
//   if (selectedActionLevel === null)
//     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
//   const targetingSchemes = targetingProperties.getTargetingSchemes(selectedActionLevel);

//   const lastUsedTargetingScheme = character.combatantProperties.selectedTargetingScheme;

//   let newTargetingScheme = lastUsedTargetingScheme;

//   if (lastUsedTargetingScheme === null || !targetingSchemes.includes(lastUsedTargetingScheme)) {
//     const defaultScheme = targetingSchemes[0];
//     if (typeof defaultScheme === "undefined")
//       return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
//     newTargetingScheme = defaultScheme;
//   } else {
//     const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
//     if (lastUsedTargetingSchemeIndex < 0)
//       return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
//     const isSelectingLastInList = lastUsedTargetingSchemeIndex === targetingSchemes.length - 1;
//     const newSchemeIndex = isSelectingLastInList ? 0 : lastUsedTargetingSchemeIndex + 1;
//     newTargetingScheme = targetingSchemes[newSchemeIndex]!;
//   }

//   // must set targetingScheme here so getValidPreferredOrDefaultActionTargets takes it into account
//   character.combatantProperties.selectedTargetingScheme = newTargetingScheme;

//   if (this.playerOption) {
//     this.playerOption.targetPreferences.targetingSchemePreference = newTargetingScheme;
//   }

//   const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(
//     combatAction,
//     selectedActionLevel
//   );
//   if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
//   const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;
//   const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
//     combatAction,
//     allyIdsOption,
//     opponentIdsOption
//   );
//   if (newTargetsResult instanceof Error) return newTargetsResult;

//   if (this.playerOption) {
//     const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
//       combatAction,
//       newTargetsResult,
//       allyIdsOption,
//       opponentIdsOption
//     );
//     if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

//     this.playerOption.targetPreferences = updatedTargetPreferenceResult;
//   }

//   character.combatantProperties.combatActionTarget = newTargetsResult;
//   return newTargetsResult;
// }
