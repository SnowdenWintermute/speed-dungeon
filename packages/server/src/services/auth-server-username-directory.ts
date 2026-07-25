import { IdentityProviderId, Username, UsernameDirectory } from "@speed-dungeon/common";
import { getUsernamesByUserIds } from "../database/get-usernames-by-user-ids.js";
import { getUserIdsByUsername } from "../database/get-user-ids-by-username.js";

export class AuthServerUsernameDirectory implements UsernameDirectory {
  async resolveUsernames(ids: IdentityProviderId[]): Promise<Map<IdentityProviderId, Username>> {
    const resolved = new Map<IdentityProviderId, Username>();
    if (ids.length === 0) {
      return resolved;
    }

    const usernamesByUserId = await getUsernamesByUserIds(ids);
    if (usernamesByUserId instanceof Error) {
      throw usernamesByUserId;
    }

    for (const id of ids) {
      const usernameOption = usernamesByUserId[id];
      if (usernameOption !== undefined) {
        resolved.set(id, usernameOption as Username);
      }
    }
    return resolved;
  }

  async findUserIdByUsername(username: Username): Promise<IdentityProviderId | undefined> {
    const userIdsByUsername = await getUserIdsByUsername([username]);
    if (userIdsByUsername instanceof Error) {
      throw userIdsByUsername;
    }

    const userIdOption = userIdsByUsername[username];
    return userIdOption === undefined ? undefined : (userIdOption as IdentityProviderId);
  }
}
