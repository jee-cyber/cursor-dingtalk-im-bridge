#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BRIDGE="$ROOT/.cursor/hooks/dingtalk-im-bridge"
HOOKS="$ROOT/.cursor/hooks"
NODE="$(command -v node)"
DWS="$(command -v dws || true)"
LABEL="com.yurun.dingtalk-im-bridge"
PLIST_DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$HOME/Library/Logs/yurun-dingtalk-bridge"

if [[ -z "$NODE" ]]; then
  echo "未找到 node，请先安装 Node.js 并加入 PATH。" >&2
  exit 1
fi
if [[ -z "$DWS" ]]; then
  echo "未找到 dws，请先安装钉钉 DWS CLI。" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
mkdir -p "$BRIDGE/state" "$BRIDGE/inbox"
touch "$HOOKS/dingtalk-auto-reply.flag"

# 写入 PATH，避免 LaunchAgent 环境找不到 nvm 下的 node/dws
NODE_BIN="$(dirname "$NODE")"
DWS_BIN="$(dirname "$DWS")"
CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin"
USER_BIN="${HOME}/bin"
export PATH="$USER_BIN:$NODE_BIN:$DWS_BIN:$CURSOR_BIN:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

cat > "$PLIST_DEST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE}</string>
    <string>${BRIDGE}/bridge.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${USER_BIN}:${NODE_BIN}:${DWS_BIN}:${CURSOR_BIN}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl kickstart -k "gui/$(id -u)/${LABEL}" 2>/dev/null || launchctl start "${LABEL}" 2>/dev/null || true

echo "已安装并启动 ${LABEL}"
echo "  日志: ${LOG_DIR}/stderr.log"
echo "  停止: ${BRIDGE}/uninstall.sh"
echo "  手动: node ${BRIDGE}/bridge.js"
