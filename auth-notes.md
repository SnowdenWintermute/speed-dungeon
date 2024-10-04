Best Practices

-   use argon2id to hash passwords
-   salt the hash with a "unique value unique to that specific login credential""
-   add a pepper not stored in db
-   user account should be separate from identity
    -   allow multiple identities to link to a single user account
    -   an internal id for each identity
    -   that identity is associated with various email/password combos
    -   any profile is also associated with that identity id

Auth Server Responsibilities

-   registration
    -   get credential data
    -   verify it is unique
    -   send a confirmation email
    -   create the identity in the db if it doesn't exist
    -   if registering with the same email from another identity
        provider, link their new credentials
-   login
    -   verify credentials
    -   provide a JWT access token with expiry
    -   store a session id with expiry
-   handle logout
-   password reset email
-   rate limit (create separate library)
-   accept request from other services to verify auth cookies
    and return identity and general profile data
    -   game servers can then use the identity to look up
        account data and user's game specific data in their dbs
-   ban/lock out users
    -   game servers can request a user be banned or locked out
    -   game servers must disconnect the banned users from any
        ongoing ws connection
    -   other game servers can be subscribed to a channel that
        the auth server will publish a message on to disconnect the
        banned users in other servers
