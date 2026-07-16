#!/usr/bin/env bash
set -euo pipefail

# Deploy CampusNav to the Oracle VM: tar source -> /srv/campusnav/app,
# npm ci && npm run build, then systemctl restart. Preserves .env,
# node_modules, dist, and src/server/assets (untracked on the VM).
#
# Local:   ./scripts/deploy-vm.sh                 # uses defaults below
# CI:      SSH_KEY / VM_HOST / VM_USER / VM_APP_DIR injected as env vars.
SSH_KEY="${SSH_KEY:-/c/Users/admin/Downloads/server keys/ssh-key-2026-06-19.key}"
HOST="${VM_HOST:-${1:-149.118.60.251}}"
USER="${VM_USER:-ubuntu}"
APP_DIR="${VM_APP_DIR:-/srv/campusnav/app}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARBALL="$(mktemp /tmp/campusnav-deploy-XXXXXX.tar.gz)"
REMOTE_TAR="/tmp/campusnav-deploy.tar.gz"

echo "==> Tarballing $ROOT (excluding .git, node_modules, dist, .env, assets)"
tar -C "$ROOT" \
  --exclude='.git' --exclude='node_modules' --exclude='dist' \
  --exclude='.env' --exclude='src/server/assets' --exclude='.planning' \
  --exclude='.gsd' --exclude='mobile' --exclude='*.log' --exclude='.hermes' \
  -czf "$TARBALL" .

echo "==> scp -> $USER@$HOST:$REMOTE_TAR"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o BatchMode=yes "$TARBALL" "$USER@$HOST:$REMOTE_TAR"

echo "==> Extract + build + restart on VM"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o BatchMode=yes "$USER@$HOST" bash -s <<REMOTE
set -euo pipefail
APP_DIR="$APP_DIR"
mkdir -p "\$APP_DIR"
tar -C "\$APP_DIR" -xzf "$REMOTE_TAR"
cd "\$APP_DIR"
npm ci
npm run build
sudo systemctl restart campusnav
for i in \$(seq 1 25); do
  if curl -fsS http://localhost:3001/ >/dev/null 2>&1; then echo "OK: server responding"; break; fi
  sleep 1
done
sudo systemctl is-active --quiet campusnav && echo "campusnav: active" || { echo "campusnav: NOT active"; sudo systemctl status campusnav --no-pager; exit 1; }
REMOTE

rm -f "$TARBALL"
echo "==> Deploy complete"
