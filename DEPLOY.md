# Deploy — split speed-dungeon onto the VPS

Deploys the split speed-dungeon (lobby / 2 game servers / asset / frontend) by folding it into the
box's single `vps.docker.yml` (docker-compose v1). Destroys speed-dungeon's DB, keeps snowauth
accounts. `docker-compose down` briefly stops every site on the box — that's accepted here.

Replace the `<PLACEHOLDERS>` (ssh host, compose dir path, docker project name) with your values.

---

## 1. Dev machine — push the images

```bash
docker login                                      # as snowd3n
docker push snowd3n/speed-dungeon:server
docker push snowd3n/speed-dungeon:asset-server
docker push snowd3n/speed-dungeon:frontend
```

(Rebuild first only if code changed since they were built:
`docker build --target server -f dockerfiles/server.Dockerfile -t snowd3n/speed-dungeon:server .`,
`--target asset-server ... -t snowd3n/speed-dungeon:asset-server`, and
`docker build --target frontend -f dockerfiles/frontend.Dockerfile -t snowd3n/speed-dungeon:frontend .`)

## 2. Dev machine — copy config to the box

```bash
# from the repo root
scp vps.docker.yml             <YOU>@roguelikeracing.com:<COMPOSE_DIR>/vps.docker.yml
scp packages/server/nginx.conf <YOU>@roguelikeracing.com:/etc/nginx/sites-available/<YOUR_SITE_FILE>
```

## 3. VPS — secrets in `.speed-dungeon-env`

The new images require `TOKENS_SECRET` (shared by lobby + both game servers — one file, so
automatic) and `INTERNAL_SERVICES_SECRET` (must equal snowauth's).

```bash
cd <COMPOSE_DIR>

# add a token secret if missing
grep -q '^TOKENS_SECRET=' .speed-dungeon-env || \
  echo "TOKENS_SECRET=$(openssl rand -base64 32)" >> .speed-dungeon-env

# INTERNAL_SERVICES_SECRET must match snowauth's (.env). Values must be identical:
grep INTERNAL_SERVICES_SECRET .speed-dungeon-env .env

# confirm the shared vars carried over from the old combined server:
grep -E '^(NODE_ENV|FRONT_END_URL|AUTH_SERVER_URL|POSTGRES_HOST|POSTGRES_DB|POSTGRES_PORT|POSTGRES_USER|POSTGRES_PASSWORD|DATABASE_URL|VALKEY_URL)=' .speed-dungeon-env
# AUTH_SERVER_URL MUST include snowauth's /auth prefix, e.g. http://snowauth-server:8081/auth —
# the lobby calls ${AUTH_SERVER_URL}/internal/sessions, and snowauth serves its routes under /auth.
# (The compose intentionally does NOT override AUTH_SERVER_URL, so this env value is authoritative.)
```

## 4. VPS — swap nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. VPS — wipe SD's DB and bring up the new stack

`docker-compose down` does not delete volumes, so snowauth's data is safe.

```bash
cd <COMPOSE_DIR>

docker-compose pull                                  # pull the 3 new images
docker-compose down                                  # stops all containers (brief blip for every site)

docker volume ls | grep speed_dungeon_pg             # find the real (project-prefixed) name
docker volume rm <PROJECT>_speed_dungeon_pg_volume   # destroys SD data ONLY

docker-compose up -d
```

## 6. VPS — verify

```bash
docker-compose ps                                              # all up; SD services healthy
docker-compose logs speed-dungeon-lobby | grep -i migration    # "Migrations completed successfully"
docker-compose logs speed-dungeon-game-server-1 | grep -i "asset facts"   # fetched, no exit 1
docker exec <PROJECT>_speed-dungeon-valkey_1 valkey-cli HGETALL game-server-registry:servers   # both registered
```

Then in a browser: log in (snowauth), create a game, start it — you should be handed to
`wss://roguelikeracing.com/game-server-1` (or `-2`).

---

## If something breaks

- **Auth/token error at the lobby on boot** → almost always `TOKENS_SECRET` or
  `INTERNAL_SERVICES_SECRET` missing/mismatched in `.speed-dungeon-env`.
- **Game server exits / restarts** → it couldn't fetch asset facts; check the asset server is
  healthy (`docker-compose logs speed-dungeon-asset-server`).
- **Rollback** → pushing the new `:server`/`:frontend` overwrites the old combined images on
  Docker Hub (we chose not to preserve them). To roll back: check out the pre-split commit from git
  history, rebuild the old combined `:server` + `:client` images and push them, restore that
  commit's `vps.docker.yml` and nginx site, then `docker-compose up -d`.

## Port map on the box (all host ports, for reference)

| port | service |
|------|---------|
| 3000 | personal site |
| 3002 | speed-dungeon frontend |
| 3005 | battle-school client |
| 3008 | twistgame |
| 8083 | speed-dungeon lobby |
| 8084 | snowauth |
| 8085 | battle-school server |
| 8086 | speed-dungeon game-server-2 |
| 8087 | speed-dungeon asset-server |
| 8088 | speed-dungeon game-server-1 |
