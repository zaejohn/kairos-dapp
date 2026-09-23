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

# If something is already serving a healthy proof server on this port, reuse it
# rather than fighting over the port. Another project on the same machine may
# already be running one, and rebinding would fail with "address already in use".
already_up=0
existing_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$PORT/health" || true)
if [ "$existing_code" = "200" ]; then
  existing_version=$(curl -s --max-time 3 "http://localhost:$PORT/version" || true)
  echo "A proof server is already serving http://localhost:$PORT (version ${existing_version:-unknown})."
  echo "Reusing it — no container started."
  already_up=1
fi

if [ "$already_up" -eq 0 ]; then
  echo "Removing any previous container..."
  docker rm -f "$NAME" >/dev/null 2>&1 || true

  echo "Starting $IMAGE on port $PORT..."
  docker run -d --name "$NAME" -p "$PORT:6300" "$IMAGE" midnight-proof-server -v >/dev/null
fi

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
  if [ "$already_up" -eq 0 ]; then
    docker logs "$NAME" 2>&1 | tail -20 >&2
  fi
  exit 1
fi

echo
echo "Version endpoint:"
curl -s "http://localhost:$PORT/version" || true
echo
echo
if [ "$already_up" -eq 0 ]; then
  echo "Recent logs:"
  docker logs "$NAME" 2>&1 | tail -8
  echo
  echo "Leave it running while using the dApp. Stop it with: docker rm -f $NAME"
else
  echo "Reused an existing proof server; no container was created by this script."
fi

echo
echo "Proof server is up at http://localhost:$PORT"
