import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { getAuthSession } from "./utils/get-auth-session.js";
import { createGuestUser } from "./utils/create-guest-user.js";
import { TaggedUserId, Username } from "@speed-dungeon/common";
import { idGenerator } from "../singletons/index.js";
import { UserIdType } from "@speed-dungeon/common";

export async function getLoggedInUserOrCreateGuest(
  authSessionId: undefined | string
): Promise<{ username: Username; taggedUserId: TaggedUserId }> {
  if (!authSessionId) {
    return createGuestUser(idGenerator.generate());
  }

  try {
    const authenticatedUserOption = await getAuthSession(authSessionId);
    if (authenticatedUserOption === null) {
      return createGuestUser(idGenerator.generate());
    }

    const { username, userId } = authenticatedUserOption;

    // if they don't yet have a profile, create one
    const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne("ownerId", userId);
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      await speedDungeonProfilesRepo.insert(userId);
    } else {
      console.info("user has an existing profile");
    }

    return { username, taggedUserId: { type: UserIdType.Auth, id: userId } };
  } catch (error) {
    console.info("Auth server error", error);
    return createGuestUser(idGenerator.generate());
  }
}
