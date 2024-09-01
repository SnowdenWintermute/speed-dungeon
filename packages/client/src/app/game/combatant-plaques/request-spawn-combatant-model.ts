import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { AdventuringParty, CombatantDetails, cloneVector3 } from "@speed-dungeon/common";

export default function requestSpawnCombatantModel(
  combatantDetails: CombatantDetails,
  party: AdventuringParty,
  mutateNextBabylonMessagingStore: MutateState<NextBabylonMessagingState>,
  modelDomPositionElement: HTMLDivElement | null
) {
  const entityId = combatantDetails.entityProperties.id;
  const { combatantProperties } = combatantDetails;

  let startRotation = Math.PI / 2;
  let modelCorrectionRotation = 0;

  const isPlayer = combatantProperties.controllingPlayer !== null;
  const monsterType = party.currentRoom.monsters[entityId]?.monsterType ?? null;

  if (!isPlayer) {
    startRotation = -Math.PI / 2;
    modelCorrectionRotation = Math.PI;
  }

  if (!isPlayer && monsterType === null) return;

  mutateNextBabylonMessagingStore((state) => {
    state.nextToBabylonMessages.push({
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
    });
  });
}
