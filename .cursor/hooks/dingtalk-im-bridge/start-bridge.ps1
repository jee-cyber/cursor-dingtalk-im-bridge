# 前台或计划任务入口：加载 env.local.ps1 后启动 bridge.js
$ErrorActionPreference = "Stop"
$BridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $BridgeDir "..\..\..")).Path
$HooksDir = Join-Path $Root ".cursor\hooks"

$localEnv = Join-Path $BridgeDir "env.local.ps1"
if (Test-Path $localEnv) {
  . $localEnv
}

if (-not $env:DINGTALK_SELF_OPEN_ID) {
  Write-Error "请复制 env.local.example.ps1 为 env.local.ps1 并设置 DINGTALK_SELF_OPEN_ID"
}

New-Item -ItemType Directory -Force -Path (Join-Path $BridgeDir "state") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BridgeDir "inbox") | Out-Null
New-Item -ItemType File -Force -Path (Join-Path $HooksDir "dingtalk-auto-reply.flag") | Out-Null

Set-Location $Root
$node = Get-Command node -ErrorAction Stop
& $node.Source (Join-Path $BridgeDir "bridge.js")
