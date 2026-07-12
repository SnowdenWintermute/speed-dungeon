import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantId } from "../aliases.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { CharacterControlScheme } from "../game-modes/index.js";
import { SpeedDungeonGame } from "./index.js";

export interface ShardPayment {
  characterId: CombatantId;
  amount: number;
}

export class PlayerShardPool {
  private constructor(private readonly characters: Combatant[]) {}

  static forCharacter(game: SpeedDungeonGame, party: AdventuringParty, character: Combatant) {
    const { controlledBy } = character.combatantProperties;
    const isPooled =
      game.characterControlScheme === CharacterControlScheme.Captain &&
      controlledBy.isPlayerControlled();

    if (!isPooled) {
      return new PlayerShardPool([character]);
    }

    const player = game.getExpectedPlayer(controlledBy.controllerPlayerName);
    const otherCharacters = player
      .getCharactersInParty(party)
      .filter((partyCharacter) => partyCharacter.getEntityId() !== character.getEntityId())
      .sort(
        (a, b) =>
          b.combatantProperties.inventory.shards - a.combatantProperties.inventory.shards ||
          a.getEntityId().localeCompare(b.getEntityId())
      );
    return new PlayerShardPool([character, ...otherCharacters]);
  }

  isSharedAmongCharacters() {
    return this.characters.length > 1;
  }

  getTotalShards() {
    let total = 0;
    for (const character of this.characters) {
      total += character.combatantProperties.inventory.shards;
    }
    return total;
  }

  canAffordShardPrice(price: number) {
    return price <= this.getTotalShards();
  }

  requireShardCount(count: number) {
    if (!this.canAffordShardPrice(count)) {
      throw new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);
    }
  }

  /** The spending character pays as much as they can before shards are
   * extracted from the rest of the pool */
  planPayments(price: number): ShardPayment[] {
    this.requireShardCount(price);

    const payments: ShardPayment[] = [];
    let remaining = price;
    for (const character of this.characters) {
      if (remaining === 0) {
        break;
      }
      const amount = Math.min(character.combatantProperties.inventory.shards, remaining);
      if (amount === 0) {
        continue;
      }
      payments.push({ characterId: character.getEntityId(), amount });
      remaining -= amount;
    }
    return payments;
  }

  static applyPayments(party: AdventuringParty, payments: ShardPayment[]) {
    for (const { characterId, amount } of payments) {
      const character = party.combatantManager.getExpectedCombatant(characterId);
      character.combatantProperties.inventory.changeShards(amount * -1);
    }
  }
}
