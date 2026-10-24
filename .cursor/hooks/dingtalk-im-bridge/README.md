# 钉钉 IM 桥接（个人）

监听 **@我** 与 **单聊**，以你的 `dws` 身份 ack、分流、入队，并唤醒 Cursor Agent。

## 策略（当前）

| 项 | 行为 |
|----|------|
| 权限 | 仅本机你的钉钉 OAuth；回复 `--as user` |
| 新功能 | 缺 `YJ2RQ`/`RJ2RQ` 先索要；有编号 → Spec 落盘 → 澄清 → **自动编码** |
| 群聊 | **允许自动编码**（有编号即可入队） |
| 澄清 | 简单问题在原会话；**复杂**（≥3 问或 `complexClarify`）→ 单聊提问者 |
| DIP | S4/ECC → `yurun-dip-publish`；默认不自动 enable |

## 一键安装（LaunchAgent 常驻）

```bash
cd /path/to/ai-workflow
chmod +x .cursor/hooks/dingtalk-im-bridge/*.sh
.cursor/hooks/dingtalk-im-bridge/install.sh
```

会：创建 `inbox/state`、启用 `dingtalk-auto-reply.flag`、登录时自动跑 bridge。

```bash
.cursor/hooks/dingtalk-im-bridge/status.sh   # 状态
.cursor/hooks/dingtalk-im-bridge/uninstall.sh # 卸载
```

手动前台：`node .cursor/hooks/dingtalk-im-bridge/bridge.js`  
可选：`export DWS_PROFILE=你的profile`

## Cursor 衔接

| 文件 | 作用 |
|------|------|
| `inbox/<jobId>.json` | 工单状态（勿提交 Git） |
| `dingtalk-agent-wake.flag` | 新 Agent 会话注入（`sessionStart`） |
| `pending-reply.json` | Agent 写回执；`stop` 钩子发钉钉 |
| `dingtalk-code.flag` | 澄清完成，`stop` 触发 followup 编码 |
| `dingtalk-auto-reply.flag` | 可选；无 pending 时也允许 stop 发钉钉 |
| `dingtalk-open-chat-prompt.txt` | 入队时生成的首条提示（可复制进 Chat） |

入队后 **FULL_AUTO（默认开）**：后台 `run-auto-agent.js` → `cursor-agent --print --model composer-2.5` → 写 `pending-reply.json` → 自动回钉钉。

关闭全自动：`export DINGTALK_FULL_AUTO=0` 后重装 LaunchAgent。

日志：`~/Library/Logs/yurun-dingtalk-bridge/agent-<jobId>.log`

Agent 指令见 [AGENT-PROMPTS.md](./AGENT-PROMPTS.md)。

## cursor-agent（自动跑 Agent）

官方安装脚本写 `~/.local/share`，若 `.local` 属 **root** 会失败。用本仓脚本：

```bash
.cursor/hooks/dingtalk-im-bridge/install-cursor-agent.sh
```

装到 `~/.cursor/cursor-agent`，链接 `~/bin/cursor-agent`。`~/.zshrc` 需有 `export PATH="$HOME/bin:$PATH"`。

首次还需登录（与 Cursor 账号一致）：

```bash
cursor-agent login
# 或 ~/bin/cursor-agent login
```

可选修复 root 的 `.local`（恢复官方安装器）：`sudo chown -R "$(whoami):staff" ~/.local`

## 首次发送

`dws chat +messages-send` 可能需要本机确认一次；在终端试发通过后 bridge 才能自动回。

## 停止

前台 `Ctrl+C`。LaunchAgent 用 `launchctl unload`。
