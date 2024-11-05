import { raceGameRecordsRepo } from "../database/repos/race-game-records";

export async function getRaceGameRecordWithTwoPartyRecords(
  userId: number,
  party1Name: string,
  party2Name: string
) {
  const recordShouldContainWipe = await raceGameRecordsRepo.findAllGamesByUserId(userId);
  const record = recordShouldContainWipe[0];
  if (!record) return false;
  const party1Record = record.parties[party1Name];
  const party2Record = record.parties[party2Name];
  if (!party1Record || !party2Record) return false;
  return { record, party1Record, party2Record };
}
