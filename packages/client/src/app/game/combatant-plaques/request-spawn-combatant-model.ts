import { useGameStore } from "@/stores/game-store";
import { AdventuringParty, Combatant, cloneVector3 } from "@speed-dungeon/common";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";

export default function requestSpawnCombatantModel(
  combatant: Combatant,
  party: AdventuringParty,
  modelDomPositionElement: HTMLDivElement | null
) {
  const entityId = combatant.entityProperties.id;
  const { combatantProperties } = combatant;

  useGameStore.getState().mutateState((state) => {
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

  gameWorld.current?.modelManager.enqueueMessage(entityId, {
    type: ModelManagerMessageType.SpawnModel,
    blueprint: {
      combatant,
      startPosition: cloneVector3(combatantProperties.homeLocation),
      startRotation,
      modelCorrectionRotation,
      modelDomPositionElement,
    },
    checkIfRoomLoaded: true,
  });
}
