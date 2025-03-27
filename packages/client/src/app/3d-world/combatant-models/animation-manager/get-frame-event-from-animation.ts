// import {
//   CombatantProperties,
//   ERROR_MESSAGES,
//   Inventory,
//   PerformCombatActionActionCommandPayload,
//   SpeedDungeonGame,
//   CONSUMABLE_TYPE_STRINGS,
//   CombatantEquipment,
//   Equipment,
//   applyEquipmentEffectWhileMaintainingResourcePercentages,
// } from "@speed-dungeon/common";
// import { GameWorld } from "../../game-world";
// import {
//   FloatingMessageElementType,
//   FloatingMessageTextColor,
//   startFloatingMessage,
// } from "@/stores/game-store/floating-messages";
// import getCurrentParty from "@/utils/getCurrentParty";
// import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
// import { useGameStore } from "@/stores/game-store";
// import { induceHitRecovery } from "./induce-hit-recovery";
// import { ModelActionType } from "../../game-world/model-manager/model-actions";

// export function getFrameEventFromAnimation(
//   gameWorld: GameWorld,
//   actionPayload: PerformCombatActionActionCommandPayload,
//   actionUserId: string
// ): { fn: () => void; frame: number } {
//   const { hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } = actionPayload;

//   let animationEventOption: null | (() => void) = null;

//   animationEventOption = () => {
//     let wasSpell = false;
//     useGameStore.getState().mutateState((state) => {
//       const gameOption = state.game;
//       if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
//       const game = gameOption;
//       const actionUserResult = SpeedDungeonGame.getCombatantById(game, actionUserId);
//       if (actionUserResult instanceof Error) return console.error(actionUserResult);
//       if (combatAction.type === CombatActionType.AbilityUsed) {
//         switch (combatAction.abilityName) {
//           case AbilityName.Attack:
//           case AbilityName.AttackMeleeMainhand:
//           case AbilityName.AttackMeleeOffhand:
//           case AbilityName.AttackRangedMainhand:
//             break;
//           case AbilityName.Fire:
//           case AbilityName.Ice:
//           case AbilityName.Healing:
//             wasSpell = true;
//             state.combatLogMessages.push(
//               new CombatLogMessage(
//                 `${actionUserResult.entityProperties.name} casts ${ABILITY_NAME_STRINGS[combatAction.abilityName]}`,
//                 CombatLogMessageStyle.Basic
//               )
//             );
//         }
//       } else if (combatAction.type === CombatActionType.ConsumableUsed) {
//         const itemResult = Inventory.getConsumableById(
//           actionUserResult.combatantProperties.inventory,
//           combatAction.itemId
//         );
//         if (itemResult instanceof Error) return console.error(itemResult);
//         new CombatLogMessage(
//           `${actionUserResult.entityProperties.name} uses ${CONSUMABLE_TYPE_STRINGS[itemResult.consumableType]}`,
//           CombatLogMessageStyle.Basic
//         );
//       }
//     });

//     if (hpChangesByEntityId)
//       for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId))
//         induceHitRecovery(gameWorld, actionUserId, targetId, hpChange, wasSpell);

//     if (mpChangesByEntityId) {
//       for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
//         startFloatingMessage(
//           targetId,
//           [
//             {
//               type: FloatingMessageElementType.Text,
//               text: mpChange,
//               classNames: {
//                 mainText: getTailwindClassFromFloatingTextColor(
//                   FloatingMessageTextColor.ManaGained
//                 ),
//                 shadowText: "",
//               },
//             },
//           ],
//           2000
//         );

//         useGameStore.getState().mutateState((state) => {
//           const gameOption = state.game;
//           if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
//           const game = gameOption;
//           if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
//           const partyOptionResult = getCurrentParty(state, state.username);
//           if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
//           if (partyOptionResult === undefined)
//             return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

//           const targetResult = SpeedDungeonGame.getCombatantById(game, targetId);
//           if (targetResult instanceof Error) return console.error(targetResult);
//           CombatantProperties.changeMana(targetResult.combatantProperties, mpChange);

//           state.combatLogMessages.push(
//             new CombatLogMessage(
//               `${targetResult.entityProperties.name} recovered ${mpChange} mana`,
//               CombatLogMessageStyle.Basic
//             )
//           );
//         });
//       }
//     }

//     if (missesByEntityId)
//       for (const targetId of missesByEntityId) {
//         // push evade action
//         const targetModel = gameWorld.modelManager.combatantModels[targetId];
//         if (targetModel === undefined)
//           return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

//         // START THEIR EVADE ANIMATION

//         targetModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.EVADE, 500, {
//           shouldLoop: false,
//           animationEventOption: null,
//           animationDurationOverrideOption: null,
//           onComplete: () => {},
//         });

//         useGameStore.getState().mutateState((state) => {
//           const gameOption = state.game;
//           if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
//           const game = gameOption;
//           if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
//           const partyOptionResult = getCurrentParty(state, state.username);
//           if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
//           if (partyOptionResult === undefined)
//             return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

//           const targetResult = SpeedDungeonGame.getCombatantById(game, targetId);
//           if (targetResult instanceof Error) return console.error(targetResult);

//           state.combatLogMessages.push(
//             new CombatLogMessage(
//               `${targetResult.entityProperties.name} evaded`,
//               CombatLogMessageStyle.Basic
//             )
//           );
//         });

//         startFloatingMessage(
//           targetId,
//           [
//             {
//               type: FloatingMessageElementType.Text,
//               text: "Evaded",
//               classNames: { mainText: "text-gray-500", shadowText: "text-black" },
//             },
//           ],
//           2000
//         );
//       }

//     useGameStore.getState().mutateState((state) => {
//       if (actionPayload.durabilityChanges !== undefined) {
//         const gameOption = state.game;
//         if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
//         const game = gameOption;
//         for (const [entityId, durabilitychanges] of Object.entries(
//           actionPayload.durabilityChanges.records
//         )) {
//           const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
//           if (combatantResult instanceof Error) return combatantResult;

//           applyEquipmentEffectWhileMaintainingResourcePercentages(
//             combatantResult.combatantProperties,
//             () => {
//               for (const change of durabilitychanges.changes) {
//                 const { taggedSlot, value } = change;
//                 const equipmentOption = CombatantEquipment.getEquipmentInSlot(
//                   combatantResult.combatantProperties,
//                   taggedSlot
//                 );
//                 if (equipmentOption) {
//                   Equipment.changeDurability(equipmentOption, value);
//                   // remove the model if it broke
//                   // @TODO - if this causes bugs because it is jumping the queue, look into it
//                   // if we use the queue though, it doesn't remove their item model imediately
//                   // if (Equipment.isBroken(equipmentOption)) {
//                   //   gameWorld.modelManager.modelActionQueue.enqueueMessage({
//                   //     type: ModelActionType.ChangeEquipment,
//                   //     entityId: combatantResult.entityProperties.id,
//                   //     unequippedIds: [equipmentOption.entityProperties.id],
//                   //   });
//                   // }
//                   if (Equipment.isBroken(equipmentOption)) {
//                     gameWorld.modelManager.combatantModels[
//                       combatantResult.entityProperties.id
//                     ]?.unequipHoldableModel(equipmentOption.entityProperties.id);
//                   }
//                 }
//               }
//             }
//           );
//         }
//       }
//     });
//   };

//   return { fn: animationEventOption, frame: 22 };
// }
