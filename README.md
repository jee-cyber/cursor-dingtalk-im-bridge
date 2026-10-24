# Cursor × 钉钉 IM 自动回复桥

个人钉钉 **@我 / 单聊** → 本机 **dws 监听** → 入队工单 → **cursor-agent FULL_AUTO** → 结果回钉钉。

源自雨润 TMS `ai-workflow` 实战配置，可挂到任意 Cursor 项目根目录使用。

## 能力概览

| 项 | 说明 |
|----|------|
| 监听 | 群 @我、全部单聊（需本机 `dws` 已登录） |
| 分流 | DIP/S4/ECC、新功能（YJ2RQ/RJ2RQ）、澄清续聊 |
| 媒体 | 当前消息图片下载到本地，写入 job 供 Agent Read |
| 常驻 | macOS LaunchAgent（`install.sh`） |
| Cursor | `hooks.json` 注入工单 + stop 发回执 |

## 安装到 Cursor 项目

1. 将本仓库 `.cursor/` 合并到你的项目根（或整仓 clone 后把业务代码放进同根目录）。
2. 复制 `.cursor/hooks.json.example` 为 `.cursor/hooks.json`，或把其中 `sessionStart` / `stop` 条目合并进已有 hooks。
3. 可选：复制 `.cursor/rules/dingtalk-agent-default.mdc` 到项目 `.cursor/rules/`。

```bash
export DINGTALK_SELF_OPEN_ID="<你的 openDingTalkId>"
export DWS_PROFILE=""   # 多 profile 时填写
chmod +x .cursor/hooks/dingtalk-im-bridge/*.sh
.cursor/hooks/dingtalk-im-bridge/install.sh
cursor-agent login      # 或 install-cursor-agent.sh
```

关闭全自动：`export DINGTALK_FULL_AUTO=0` 后重装 LaunchAgent。

## 目录说明

- `.cursor/hooks/dingtalk-im-bridge/` — bridge、路由、媒体、LaunchAgent 脚本
- `.cursor/hooks/dingtalk-pending-context.js` — sessionStart 注入
- `.cursor/hooks/dingtalk-pending-reply.js` — stop 回钉钉

详细运维见 [.cursor/hooks/dingtalk-im-bridge/README.md](.cursor/hooks/dingtalk-im-bridge/README.md)。

## 环境变量

| 变量 | 含义 |
|------|------|
| `DINGTALK_SELF_OPEN_ID` | 必填，过滤自己消息 |
| `DINGTALK_FULL_AUTO` | `0` 关闭 cursor-agent 后台跑 |
| `DINGTALK_AGENT_MODEL` | 默认 `composer-2.5` |
| `CURSOR_AGENT_BIN` | cursor-agent 路径 |
| `DWS_PROFILE` | dws profile |

## 安全

勿提交 `inbox/`、`state/`、`media/`、`pending-reply.json`；密钥不进 Git。睡眠/断网期间不会可靠收消息。

## License

MIT
