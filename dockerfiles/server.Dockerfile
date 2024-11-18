# just download production deps, we'll copy them into the next step as well as the final step
FROM node:alpine AS deployDeps
WORKDIR /app
RUN mkdir /app/packages
RUN mkdir /app/packages/common
RUN mkdir /app/packages/server

COPY package.json .
COPY packages/common/package.json ./packages/common
COPY packages/server/package.json ./packages/server

RUN yarn install --pure-lockfile --non-interactive --production

# Get dev deps because they are needed to build the app (tailwind)
FROM node:alpine AS buildDeps
WORKDIR /app
RUN mkdir /app/packages
RUN mkdir /app/packages/common
RUN mkdir /app/packages/server

COPY package.json .
COPY packages/common/package.json ./packages/common
COPY packages/server/package.json ./packages/server

RUN yarn install --pure-lockfile --non-interactive

# build app
FROM node:latest as builder
WORKDIR /
RUN npm install -g typescript -y

WORKDIR /app
COPY --from=buildDeps /app/package.json ./package.json
COPY --from=buildDeps /app/node_modules ./node_modules
# COPY --from=deployDeps /app/packages/server/node_modules ./packages/server/node_modules

COPY packages/common/ ./packages/common/
COPY packages/server/src ./packages/server/src
COPY packages/server/tsconfig.json ./packages/server/
COPY tsconfig.json .

WORKDIR /app/packages/common
RUN tsc && echo compiled common directory

WORKDIR /app/packages/server
RUN tsc && echo compiled server directory

FROM node:alpine
WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/src/database/migrations ./packages/server/src/database/migrations
COPY --from=builder /app/packages/common/dist ./packages/common/dist

COPY --from=deployDeps /app/packages/server/package.json ./packages/server
COPY --from=deployDeps /app/packages/common/package.json ./packages/common
COPY --from=deployDeps /app/node_modules ./node_modules
# COPY --from=deployDeps /app/packages/server/node_modules ./packages/server/node_modules
WORKDIR /app/packages/server
CMD ["node", "dist/index.js"]

