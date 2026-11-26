#!/bin/bash
# Runs the GuessMoji public demo as macOS background services (launchd LaunchAgents):
#   com.guessmoji.server  - the production Next.js server on 127.0.0.1:3000
#   com.guessmoji.tunnel  - ngrok, connecting the permanent free domain to the server
#   com.guessmoji.awake   - caffeinate -i, so the Mac doesn't go to sleep when idle
# They start at login and restart if they stop, independent of any terminal or editor.
#
# Usage:
#   scripts/public-demo.sh install <your-domain>.ngrok-free.dev
#   scripts/public-demo.sh status | restart | uninstall
#
# Needs: macOS, Node 22.13+, `npm run build` done, ngrok with its authtoken saved
# (`ngrok config add-authtoken ...`), and .env.local with APP_URL and SMTP settings.
set -euo pipefail

APP="$(cd "$(dirname "$0")/.." && pwd)"
LA="$HOME/Library/LaunchAgents"
LOGS="$HOME/Library/Logs/GuessMoji"
DOMAIN_FILE="$LOGS/.domain"
SERVICES=(server tunnel awake)
UID_TARGET="gui/$(id -u)"

die() { echo "Error: $*" >&2; exit 1; }

write_plist() { # name, then program arguments
  local name=$1; shift
  python3 - "$LA/com.guessmoji.$name.plist" "$name" "$APP" "$LOGS" "$(dirname "$NODE")" "$@" <<'PY'
import plistlib, sys
out, name, app, logs, nodedir, *args = sys.argv[1:]
plistlib.dump({
    "Label": f"com.guessmoji.{name}",
    "ProgramArguments": args,
    "WorkingDirectory": app,
    "EnvironmentVariables": {"PATH": f"{nodedir}:/usr/bin:/bin:/usr/sbin:/sbin", "NODE_ENV": "production"},
    "RunAtLoad": True,
    "KeepAlive": True,
    "ThrottleInterval": 10,
    "StandardOutPath": f"{logs}/{name}.log",
    "StandardErrorPath": f"{logs}/{name}.log",
}, open(out, "wb"))
PY
}

unload() {
  for s in "${SERVICES[@]}"; do launchctl bootout "$UID_TARGET/com.guessmoji.$s" 2>/dev/null || true; done
  # bootout returns before the services are fully gone; wait so a new bootstrap doesn't fail.
  for _ in $(seq 1 50); do
    launchctl list | grep -q com.guessmoji || return 0
    sleep 0.2
  done
}

case "${1:-}" in
  install)
    DOMAIN="${2:-}"
    [[ "$DOMAIN" =~ ^[a-z0-9-]+\.ngrok-free\.(app|dev)$ ]] || die "give your free ngrok domain, e.g. scripts/public-demo.sh install my-name.ngrok-free.dev"
    NODE="$(command -v node)" || die "node not found"
    NGROK="$(command -v ngrok || echo "$HOME/.local/bin/ngrok")"
    [ -x "$NGROK" ] || die "ngrok not found (install it to ~/.local/bin or your PATH)"
    [ -f "$APP/.next/BUILD_ID" ] || die "no production build; run npm run build first"
    [ -f "$APP/.env.local" ] || die ".env.local missing; copy .env.example and fill in SMTP settings"
    grep -q "^APP_URL=https://$DOMAIN$" "$APP/.env.local" || echo "Warning: set APP_URL=https://$DOMAIN in .env.local so email links use the public address."
    mkdir -p "$LA" "$LOGS"
    echo "$DOMAIN" > "$DOMAIN_FILE"
    write_plist server "$NODE" "$APP/node_modules/next/dist/bin/next" start -p 3000 -H 127.0.0.1
    write_plist tunnel "$NGROK" http http://127.0.0.1:3000 "--url=https://$DOMAIN" --log=stdout --log-level=warn
    write_plist awake /usr/bin/caffeinate -i
    unload
    for s in "${SERVICES[@]}"; do launchctl bootstrap "$UID_TARGET" "$LA/com.guessmoji.$s.plist"; done
    echo "Installed. GuessMoji will be at https://$DOMAIN in a few seconds. Logs: $LOGS"
    ;;
  status)
    launchctl list | grep com.guessmoji || echo "Not installed."
    [ -f "$DOMAIN_FILE" ] && curl -s -o /dev/null -H "ngrok-skip-browser-warning: 1" \
      -w "https://$(cat "$DOMAIN_FILE") -> HTTP %{http_code}\n" "https://$(cat "$DOMAIN_FILE")/" || true
    ;;
  restart)
    launchctl kickstart -k "$UID_TARGET/com.guessmoji.server" && echo "Server restarted (picks up a new build and .env.local)."
    ;;
  uninstall)
    unload
    for s in "${SERVICES[@]}"; do rm -f "$LA/com.guessmoji.$s.plist"; done
    echo "Stopped and removed. Logs kept in $LOGS"
    ;;
  *)
    sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
