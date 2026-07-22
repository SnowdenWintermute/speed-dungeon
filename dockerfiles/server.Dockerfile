# Two final targets share one build:
#   --target server        lobby + game server roles, carries no asset binaries
#   --target asset-server  the same image plus the asset set
# The role is chosen by the compose command, not by the image.

# keep the major in step with "engines" in the root package.json
ARG NODE_VERSION=22-alpine

# production deps only, copied into the final images
FROM node:${NODE_VERSION} AS deploy-deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/common/package.json ./packages/common/
COPY packages/server/package.json ./packages/server/
# --pure-lockfile rather than --frozen-lockfile: only two of the six workspace manifests are
# present here, so a frozen install would object to the lockfile covering the other four
RUN yarn install --pure-lockfile --non-interactive --production

# dev deps as well, since typescript is needed to build
FROM node:${NODE_VERSION} AS build-deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/common/package.json ./packages/common/
COPY packages/server/package.json ./packages/server/
RUN yarn install --pure-lockfile --non-interactive

FROM build-deps AS builder
COPY tsconfig.json ./
COPY packages/common ./packages/common
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/server/src ./packages/server/src

# common first: the server resolves @speed-dungeon/common through the workspace symlink to its
# dist, not to its source, so it has to exist before the server compiles
WORKDIR /app/packages/common
RUN yarn tsc -p tsconfig.build.json

WORKDIR /app/packages/server
RUN yarn tsc

FROM node:${NODE_VERSION} AS server
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deploy-deps /app/package.json ./package.json
COPY --from=deploy-deps /app/node_modules ./node_modules
COPY packages/common/package.json ./packages/common/
COPY packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
# runMigrations resolves ./src/database/migrations against the working directory
COPY packages/server/src/database/migrations ./packages/server/src/database/migrations
USER node
WORKDIR /app/packages/server
CMD ["node", "dist/entrypoints/lobby.js"]

FROM server AS asset-server
COPY packages/server/assets ./assets
ENV ASSETS_DIRECTORY=./assets
CMD ["node", "dist/entrypoints/asset-server.js"]
