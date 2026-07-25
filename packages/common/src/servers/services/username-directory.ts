import { IdentityProviderId, Username } from "../../aliases.js";

// IdentityProviderService only resolves the identity behind the connection being served. read models
// need names for players who aren't here, so name lookup by id is its own port.
export interface UsernameDirectory {
  resolveUsernames(ids: IdentityProviderId[]): Promise<Map<IdentityProviderId, Username>>;
  findUserIdByUsername(username: Username): Promise<IdentityProviderId | undefined>;
}
