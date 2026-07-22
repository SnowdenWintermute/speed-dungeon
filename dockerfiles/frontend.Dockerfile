# The Next.js frontend (packages/frontend, @speed-dungeon/frontend).
#
# It pulls in three sibling workspaces, two different ways:
#   - @speed-dungeon/common       via the node_modules symlink -> its built dist
#   - @/client-application        via tsconfig paths -> its src (next transpiles it)
#   - @/game-world-view           via tsconfig paths -> its src (next transpiles it)
# plus a few deep @speed-dungeon/client-application/src/... imports that resolve through the
# same symlink into source. So only `common` needs compiling; the other two ship as source.

# keep the major in step with "engines" in the root package.json
ARG NODE_VERSION=22-alpine

# full install: the build needs next, typescript, tailwind and the babylon toolchain
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/common/package.json ./packages/common/
COPY packages/client-application/package.json ./packages/client-application/
COPY packages/game-world-view/package.json ./packages/game-world-view/
COPY packages/frontend/package.json ./packages/frontend/
RUN yarn install --pure-lockfile --non-interactive

FROM deps AS builder
COPY tsconfig.json ./
COPY packages/common ./packages/common
COPY packages/client-application/src ./packages/client-application/src
COPY packages/client-application/tsconfig.json ./packages/client-application/
COPY packages/game-world-view/src ./packages/game-world-view/src
COPY packages/game-world-view/tsconfig.json ./packages/game-world-view/
COPY packages/frontend ./packages/frontend

# common must exist as dist before next resolves @speed-dungeon/common
WORKDIR /app/packages/common
RUN yarn tsc -p tsconfig.build.json

# next auto-loads packages/frontend/.env.production for the NEXT_PUBLIC_* urls at build time
WORKDIR /app/packages/frontend
RUN yarn build

# unoptimized runtime: carries the whole built workspace so the @speed-dungeon/* symlinks
# resolve. next output:"standalone" would trim this to a traced minimal set — deferred.
FROM node:${NODE_VERSION} AS frontend
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
USER node
WORKDIR /app/packages/frontend
EXPOSE 3000
CMD ["yarn", "start"]
