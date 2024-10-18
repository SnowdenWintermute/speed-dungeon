import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { AdventuringParty, Combatant, cloneVector3 } from "@speed-dungeon/common";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";

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

  gameWorld.current?.modelManager.enqueueMessage(entityId, {
    type: ModelManagerMessageType.SpawnModel,
    blueprint: {
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
