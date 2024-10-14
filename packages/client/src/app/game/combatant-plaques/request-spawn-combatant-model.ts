import { nextToBabylonMessageQueue } from "@/singletons/next-to-babylon-message-queue";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextToBabylonMessageTypes } from "@/singletons/next-to-babylon-message-queue";
import { AdventuringParty, Combatant, cloneVector3 } from "@speed-dungeon/common";

export default function requestSpawnCombatantModel(
  combatantDetails: Combatant,
  party: AdventuringParty,
  mutateGameStore: MutateState<GameState>,
  modelDomPositionElement: HTMLDivElement | null
) {
  const entityId = combatantDetails.entityProperties.id;
  const { combatantProperties } = combatantDetails;

  mutateGameStore((state) => {
    state.combatantModelsAwaitingSpawn.push(entityId);
  });

  let startRotation = Math.PI / 2;
  let modelCorrectionRotation = 0;

  const isPlayer = combatantProperties.controllingPlayer !== null;
  const monsterType = party.currentRoom.monsters[entityId]?.combatantProperties.monsterType ?? null;

  if (!isPlayer) {
    startRotation = -Math.PI / 2;
    modelCorrectionRotation = Math.PI;
  }

  if (!isPlayer && monsterType === null) return;

  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.SpawnCombatantModel,
    combatantModelBlueprint: {
      entityId,
      species: combatantProperties.combatantSpecies,
      monsterType,
      class: combatantProperties.combatantClass,
      startPosition: cloneVector3(combatantProperties.homeLocation),
      startRotation,
      modelCorrectionRotation,
      modelDomPositionElement,
    },
    checkIfRoomLoaded: true,
  });
}
