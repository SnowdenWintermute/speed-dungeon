import { AdventuringParty } from "../../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { CombatantWithPets } from "../../types.js";
import { invariant } from "../../utils/index.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class ProgressionModePersistencePolicy extends GameModePersistencePolicy {
  override async onCreateCharacterInLobbySetup(
    session: UserSession,
    game: SpeedDungeonGame,
    character: CombatantWithPets
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    invariant(
      session.taggedUserId.type === UserIdType.Auth,
      ERROR_MESSAGES.SERVER.EXPECTED_AUTH_USER
    );
    const { combatant, pets } = character;

    await this.userGameDataPersistenceService.saveCharacter(
      combatant,
      pets,
      session.taggedUserId.id,
      game.characterControlScheme
    );
    const outbox = new MessageDispatchOutbox(this.messageDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacter,
      data: {
        characterControlScheme: game.characterControlScheme,
        character: {
          combatant: combatant.toSerialized(),
          pets: pets.map((pet) => pet.toSerialized()),
        },
      },
    });
    return outbox;
  }

  override onGameStart(): Promise<void> {
    return Promise.resolve();
  }

  override async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  override async onLiveGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer) {
    await this.userGameDataPersistenceService.updateCharactersOwnedByPlayerInGame(game, player);
    return new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
  }
}
