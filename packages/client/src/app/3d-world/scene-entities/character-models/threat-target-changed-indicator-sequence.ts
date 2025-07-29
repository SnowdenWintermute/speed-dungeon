import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { getGameWorld } from "../../SceneManager";
import getGameAndParty from "@/utils/getGameAndParty";

export function threatTargetChangedIndicatorSequence() {
  useGameStore.getState().mutateState((gameState) => {
    const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
    if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;
    const [game, party] = gameAndPartyResult;

    for (const [monsterId, monster] of Object.entries(party.currentRoom.monsters)) {
      const newThreatTargetIdOption =
        monster.combatantProperties.threatManager?.getHighestThreatCombatantId();
      if (!newThreatTargetIdOption) continue;

      const newTargetCharacterModel = getGameWorld().modelManager.findOne(newThreatTargetIdOption);
      const monsterCharacterModel = getGameWorld().modelManager.findOne(monsterId);

      const targetPos = newTargetCharacterModel.homeLocation.position;

      const lookAtMatrix = Matrix.LookAtLH(
        monsterCharacterModel.homeLocation.position,
        targetPos,
        Vector3.Up()
      );
      // Invert because LookAtLH returns a view matrix
      const worldRotation = Quaternion.FromRotationMatrix(lookAtMatrix).invert();

      monsterCharacterModel.homeLocation.rotation = worldRotation;

      monsterCharacterModel.movementManager.startRotatingTowards(
        monsterCharacterModel.homeLocation.rotation,
        1000,
        () => {}
      );
    }
  });
}
