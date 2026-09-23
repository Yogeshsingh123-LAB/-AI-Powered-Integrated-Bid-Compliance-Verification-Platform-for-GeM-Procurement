#!/usr/bin/env bash
# One-shot recovery/startup for the Bid Zee demo environment.
# Safe to re-run any time (e.g. after a sandbox pause wiped venv/node_modules).
set -e
REPO=/home/user/repo
JWT_FILE=/home/user/dev_jwt_secret.txt

[ -f "$JWT_FILE" ] || openssl rand -hex 32 > "$JWT_FILE"
mkdir -p /home/user/devdata/uploads

# Backend venv
if [ ! -x "$REPO/.venv/bin/python" ]; then
  echo ">> rebuilding backend venv..."
  python3 -m venv "$REPO/.venv"
  "$REPO/.venv/bin/pip" install -q --upgrade pip
  "$REPO/.venv/bin/pip" install -q -r "$REPO/requirements.txt" "pymupdf>=1.24.0"
fi

# Frontend deps
if [ ! -x "$REPO/node_modules/.bin/vite" ]; then
  echo ">> reinstalling frontend deps..."
  (cd "$REPO" && npm install --no-audit --no-fund)
fi

# Seed demo accounts on a fresh database
DB="/home/user/devdata/uploads/bid_compliance_persistent.db"
if [ ! -s "$DB" ]; then
  echo ">> fresh database — will seed after API starts"
fi
