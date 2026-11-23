#!/usr/bin/env bash
set -euo pipefail

image="modeltoimage-smoke:$$"
container="modeltoimage-smoke-$$"
cleanup() {
  docker rm --force "$container" >/dev/null 2>&1 || true
  docker image rm --force "$image" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build --tag "$image" --file Dockerfile .
docker run --detach --name "$container" --publish 127.0.0.1::80 "$image" >/dev/null
mapping=$(docker port "$container" 80/tcp)
port=${mapping##*:}
base="http://127.0.0.1:$port"
deadline=$((SECONDS + 30))
while ! body=$(curl --fail --silent "$base/healthz"); do
  if ! docker inspect --format '{{.State.Running}}' "$container" | grep -q true; then
    docker logs "$container"
    exit 1
  fi
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for container health endpoint" >&2
    docker logs "$container"
    exit 1
  fi
  sleep 1
done
[[ "$body" == "ok" ]]
html=$(curl --fail --silent "$base/")
[[ "$html" == *'id="root"'* ]]
script_ref=$(printf '%s' "$html" | grep -oE 'src="[^"]+\.js"' | head -n 1)
script_ref=${script_ref#src=\"}
script_ref=${script_ref%\"}
bundle=$(curl --fail --silent "$base$script_ref")
worker=$(printf '%s' "$bundle" | grep -oE '/assets/gif\.worker-[A-Za-z0-9_-]+\.js' | head -n 1)
[[ -n "$worker" ]]
curl --fail --silent "$base$worker" >/dev/null
missing_status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$base/assets/__missing_worker__.js")
[[ "$missing_status" == "404" ]]
printf 'Docker smoke passed: root, health, app bundle, GIF worker, missing-worker 404.\n'
