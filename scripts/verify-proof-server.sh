#!/usr/bin/env bash
# Start the Midnight proof server and verify it serves.
#
# Run from WSL on Windows (the proof server is a Linux container):
#   bash scripts/verify-proof-server.sh
#
# Exits non-zero if the server does not come up healthy.

set -euo pipefail

IMAGE="midnightntwrk/proof-server:8.1.0"
NAME="kairos-proof"
PORT="6300"

echo "Removing any previous container..."
docker rm -f "$NAME" >/dev/null 2>&1 || true

echo "Starting $IMAGE on port $PORT..."
docker run -d --name "$NAME" -p "$PORT:6300" "$IMAGE" midnight-proof-server -v >/dev/null

echo "Waiting for health endpoint..."
healthy=0
for attempt in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/health" || true)
  if [ "$code" = "200" ]; then
    echo "  healthy after ${attempt}s"
    healthy=1
    break
  fi
  sleep 1
done

if [ "$healthy" -ne 1 ]; then
  echo "FAILED: proof server did not become healthy within 60s" >&2
  docker logs "$NAME" 2>&1 | tail -20 >&2
  exit 1
fi

echo
echo "Version endpoint:"
curl -s "http://localhost:$PORT/version" || true
echo
echo
echo "Recent logs:"
docker logs "$NAME" 2>&1 | tail -8

echo
echo "Proof server is up at http://localhost:$PORT"
echo "Leave it running while using the dApp. Stop it with: docker rm -f $NAME"
