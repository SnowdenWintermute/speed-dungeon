# just download production deps, we'll copy them into the next step as well as the final step
FROM node:alpine AS deployDeps
WORKDIR /app
RUN mkdir /app/packages
RUN mkdir /app/packages/common
RUN mkdir /app/packages/client

COPY package.json .
COPY packages/common/package.json ./packages/common
COPY packages/client/package.json ./packages/client

RUN yarn install --pure-lockfile --non-interactive --production

# Get dev deps because they are needed to build the app (tailwind)
FROM node:alpine AS buildDeps
WORKDIR /app
RUN mkdir /app/packages
RUN mkdir /app/packages/common
RUN mkdir /app/packages/client

COPY package.json .
COPY packages/common/package.json ./packages/common
COPY packages/client/package.json ./packages/client

RUN yarn install --pure-lockfile --non-interactive

# build app
FROM node:latest as builder
WORKDIR /
RUN npm install -g typescript -y

WORKDIR /app
COPY --from=buildDeps /app/package.json ./package.json
COPY --from=buildDeps /app/node_modules ./node_modules
COPY --from=deployDeps /app/packages/client/node_modules ./packages/client/node_modules
COPY packages/client/.env.production ./packages/client/
# COPY --from=buildDeps /app/packages/common/node_modules ./packages/client/node_modules

COPY packages/common/ ./packages/common/
COPY packages/client/src ./packages/client/src
COPY packages/client/public ./packages/client/public
COPY packages/client/next.config.mjs ./packages/client/
COPY packages/client/next-env.d.ts ./packages/client/
COPY packages/client/tailwind.config.ts ./packages/client/
COPY packages/client/postcss.config.mjs ./packages/client/
COPY packages/client/tsconfig.json ./packages/client/
COPY tsconfig.json .
COPY packages/client/package.json ./packages/client

WORKDIR /app/packages/common
RUN tsc && echo compiled common directory

WORKDIR /app/packages/client
RUN NEXT_PUBLIC_PRODUCTION="production" yarn run build

FROM node:alpine
WORKDIR /app
COPY --from=builder /app/packages/client/.next ./packages/client/.next
COPY --from=builder /app/packages/client/public ./packages/client/public
COPY --from=deployDeps /app/packages/client/node_modules ./packages/client/node_modules
COPY --from=builder /app/packages/client/package.json ./packages/client
COPY --from=builder /app/package.json ./package.json
COPY --from=deployDeps /app/node_modules ./node_modules
WORKDIR /app/packages/client
CMD ["yarn", "run", "start"]

