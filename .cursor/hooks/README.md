# Hooks

`hooks.json` 在 **sessionStart** 注入钉钉工单上下文，在 **stop** 时跑同步/门禁/钉钉回执脚本。需要本机 `node`、`dws`（钉钉回执）在 PATH 中。改完后若未生效，重开 Cursor。

## 钉钉桥接

长驻监听不在 `hooks.json` 里，需单独启动：

```bash
node .cursor/hooks/dingtalk-im-bridge/bridge.js
```

说明见 [dingtalk-im-bridge/README.md](./dingtalk-im-bridge/README.md)。

安装常驻（本机已执行可跳过）：

```bash
chmod +x .cursor/hooks/dingtalk-im-bridge/*.sh
.cursor/hooks/dingtalk-im-bridge/install.sh
```

| 脚本 | 作用 |
|------|------|
| `sync-specstory-history.js` | 把本项目 Cursor 会话写成 `.specstory/history/*.md` |
| `gate-reminder.js` | 门禁提醒：YJ 需求有 requirements/design/tasks 但没有 `testing.md`，或根上必做文件缺失时写提醒 |

默认只提醒，不自动接着跑。提醒正文在 `.cursor/hooks/last-gate-reminder.txt`（不入库）。

要让未完成的缺口自动续跑一轮：在 `.cursor/hooks/` 放空文件 `auto-continue.flag`。`stop` 钩子才会返回 `followup_message`，且 `loop_limit` 为 1。补完后删掉该文件。

手动查看：

```text
node .cursor/hooks/gate-reminder.js
```
