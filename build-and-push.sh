#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

REPO=snowd3n/speed-dungeon

# tag:dockerfile — the tag doubles as the build target
IMAGES=(
    "server:server.Dockerfile"
    "asset-server:server.Dockerfile"
    "frontend:frontend.Dockerfile"
)

for image in "${IMAGES[@]}"; do
    IFS=: read -r tag dockerfile <<<"$image"
    echo "==> building $REPO:$tag"
    docker build --target "$tag" -f "dockerfiles/$dockerfile" -t "$REPO:$tag" .
done

# pushed only after every build succeeds, so a broken build can't ship one image of a mismatched set
for image in "${IMAGES[@]}"; do
    IFS=: read -r tag _ <<<"$image"
    echo "==> pushing $REPO:$tag"
    docker push "$REPO:$tag"
done
