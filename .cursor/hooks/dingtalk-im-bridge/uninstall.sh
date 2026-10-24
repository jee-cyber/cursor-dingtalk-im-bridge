#!/usr/bin/env bash
set -euo pipefail

LABEL="com.yurun.dingtalk-im-bridge"
PLIST_DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
rm -f "$PLIST_DEST"
echo "已卸载 ${LABEL}（inbox/state 未删除）"
