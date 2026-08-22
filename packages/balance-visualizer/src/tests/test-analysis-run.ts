import { AnalysisRun } from "../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement";
import {
  AdventuringParty,
  AffixGenerator,
  CharacterControlScheme,
  CombatantClass,
  CombatAttribute,
  DefaultCharacterCreationPolicy,
  EntityName,
  EquipmentRandomizer,
  GameId,
  GameMode,
  GameName,
  IdGeneratorRandom,
  ItemBuilder,
  PartyId,
  PartyName,
  RandomNumberGenerationPolicyFactory,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  Username,
} from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation";

export function testAnalysisRun() {
  const idGenerator = new IdGeneratorRandom({ saveHistory: false });
  const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
  const itemBuilder = new ItemBuilder(
    new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy))
  );
  const characterCreationPolicy = new DefaultCharacterCreationPolicy(
    idGenerator,
    itemBuilder,
    rngPolicy
  );
  const game = new SpeedDungeonGame(
    "game id" as GameId,
    "game name" as GameName,
    GameMode.UnrankedRace,
    CharacterControlScheme.Captain
  );
  const party = AdventuringParty.createInitialized(
    "party id" as PartyId,
    "party name" as PartyName
  );
  const playerName = "player name" as Username;
  const player = new SpeedDungeonPlayer(playerName, 0);
  game.addPlayer(player);
  const characterWithPets = characterCreationPolicy.createCharacter(
    "character 1" as EntityName,
    CombatantClass.Warrior,
    playerName
  );
  game.addCharacterToParty(party, player, characterWithPets.combatant, characterWithPets.pets);

  const runner = new AnalysisRun<AttackDamageRoomReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, () => 1, [() => 1]),
    new AttributeAllocationSolver(party, () => 1, [CombatAttribute.Strength]),
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  console.log(report);
}
