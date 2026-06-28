import cloneDeep from "lodash.clonedeep";
import { AdventuringParty } from "../../adventuring-party/index.js";
import {
  EntityId,
  IdentityProviderId,
  LadderCharacterFloorClearedRecordId,
  LadderPartyFloorClearedRecordId,
  Milliseconds,
  Username,
} from "../../aliases.js";
import { APP_VERSION_NUMBER } from "../../app-consts.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { CombatantWithPets } from "../../types.js";
import { invariant } from "../../utils/index.js";
import {
  LadderCharacterFloorClearedRecord,
  LadderPartyFloorClearRecord,
} from "../ladder-records/index.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";
import { Combatant } from "../../combatants/index.js";
import { SerializedOf } from "../../serialization/index.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";

export class IronmanModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    if (game.isContinuedRun) {
      return;
    }
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.recordNewGame(game, usernamesToUserIds);
  }

  override async onLastPlayerLeftLiveGame(game: SpeedDungeonGame): Promise<void> {
    // update all game, party and character records
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
  }

  override async onFloorDescent(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds
  ): Promise<void> {
    // update all game, party and character records
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);

    // create party and character timeToClearFloor records using clearedFloor + timeSpentOnFloorMs

    const floorClearRecord: LadderPartyFloorClearRecord = {
      id: this.idGenerator.generate() as LadderPartyFloorClearedRecordId,
      partyRecordRef: party.id,
      floor: clearedFloor,
      timeSpentOnFloor: timeSpentOnFloorMs,
    };

    for (const character of party.combatantManager.getPartyMemberCharacters()) {
      const combatantLessInventory = cloneDeep(character);
      combatantLessInventory.combatantProperties.inventory.deleteAllItems();
      const petsLessInventories: SerializedOf<Combatant>[] = [];
      const pets = party.petManager.getAllPetsByOwnerId(character.getEntityId());

      for (const pet of pets) {
        const petLessInventory = cloneDeep(pet);
        petLessInventory.combatantProperties.inventory.deleteAllItems();
        petsLessInventories.push(pet.toSerialized());
      }

      const combatantWithPets: SerializedCombatantWithPets = {
        combatant: combatantLessInventory.toSerialized(),
        pets: petsLessInventories,
      };

      const characterFloorClearRecord: LadderCharacterFloorClearedRecord = {
        id: this.idGenerator.generate() as LadderCharacterFloorClearedRecordId,
        combatantSchemaVersion: APP_VERSION_NUMBER,
        partyFloorClearRecord: floorClearRecord.id,
        characterRecordRef: character.getEntityId(),
        combatantWithPets,
      };
    }
  }

  override async onPartyEscape(): Promise<void> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
    // create party and character timeToClearFloor records
  }

  override async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
    return undefined;
  }

  override async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    // update all game, party and character records
    return undefined;
  }
}
