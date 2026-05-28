#!/bin/zsh
set -euo pipefail

APP_DIR="/Users/darrenheadley/Documents/COSTAATT Studente registration e-forms"
APP_URL="http://localhost:5001/forms"
SESSION_URL="http://localhost:5001/api/dev/session"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "Starting COSTAATT Student E-Forms Portal..."
echo "Project: $APP_DIR"
echo "URL: $APP_URL"
echo

if lsof -nP -iTCP:5001 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "The portal is already running on port 5001."
  open "$SESSION_URL"
  exit 0
fi

cd "$APP_DIR"

(
  for attempt in {1..40}; do
    if curl -fsS -I "$APP_URL" >/dev/null 2>&1; then
      open "$SESSION_URL"
      exit 0
    fi
    sleep 1
  done
) &

echo "Leave this Terminal window open while using the portal."
echo "Press Control-C in this window to stop it."
echo

exec /opt/homebrew/bin/npm run dev:5001
