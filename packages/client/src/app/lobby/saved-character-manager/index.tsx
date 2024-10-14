import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useLobbyStore } from "@/stores/lobby-store";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { Vector3 } from "@babylonjs/core";
import { ClientToServerEvent, Combatant, CombatantClass } from "@speed-dungeon/common";
import React, { useEffect } from "react";

export default function SavedCharacterManager() {
  const savedCharacters = useLobbyStore().savedCharacters;
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;

  useEffect(() => {
    console.log("asking for saved characters");
    websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
  }, []);

  return (
    <div className="w-[400px] flex flex-col p-8 border border-slate-400">
      <div>
        {savedCharacters.map((character, i) => (
          <SavedCharacterDisplay
            character={character}
            index={i}
            key={character.entityProperties.id}
          />
        ))}
      </div>
      <ButtonBasic
        extraStyles="mb-4"
        onClick={() => {
          websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
        }}
      >
        GET SAVED CHARACTERS
      </ButtonBasic>
      <ButtonBasic
        onClick={() => {
          websocketConnection.emit(
            ClientToServerEvent.CreateSavedCharacter,
            "",
            CombatantClass.Mage
          );
        }}
      >
        CREATE CHARACTER
      </ButtonBasic>
      <ButtonBasic
        onClick={() => {
          mutateNextBabylonMessagingStore((state) => {
            state.nextToBabylonMessages.push({
              type: NextToBabylonMessageTypes.MoveCamera,
              instant: true,
              alpha: Math.PI / 2,
              beta: (Math.PI / 5) * 2,
              radius: 4,
              target: new Vector3(0, 1, 0),
            });
          });
        }}
      >
        MOVE CAMERA
      </ButtonBasic>
    </div>
  );
}

function SavedCharacterDisplay({ character, index }: { character: Combatant; index: number }) {
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;
  const { entityProperties, combatantProperties } = character;
  const entityId = entityProperties.id;

  useEffect(() => {
    // display them in "slots" in the 3d world
    mutateNextBabylonMessagingStore((state) => {
      const modelDomPositionElement = document.getElementById(
        `${entityId}-position-div`
      ) as HTMLDivElement | null;
      if (modelDomPositionElement === null) return;

      state.nextToBabylonMessages.push({
        type: NextToBabylonMessageTypes.SpawnCombatantModel,
        combatantModelBlueprint: {
          entityId: entityProperties.id,
          species: combatantProperties.combatantSpecies,
          monsterType: null,
          class: combatantProperties.combatantClass,
          startPosition: new Vector3(-1 + index * 1, 0, 0),
          startRotation: 0,
          modelCorrectionRotation: 0,
          modelDomPositionElement,
        },
        checkIfRoomLoaded: false,
      });
    });

    return () => {
      mutateNextBabylonMessagingStore((state) => {
        state.nextToBabylonMessages.push({
          type: NextToBabylonMessageTypes.RemoveCombatantModel,
          entityId,
        });
      });
    };
  }, []);
  return (
    <div id={`${entityId}-position-div`} className="absolute">
      {character.entityProperties.name}
    </div>
  );
}
