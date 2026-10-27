# 注册「登录时」计划任务，后台常驻钉钉 bridge（需已安装 Node、dws、cursor-agent）
param(
  [string]$TaskName = "CursorDingtalkImBridge"
)

$ErrorActionPreference = "Stop"
$BridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Join-Path $BridgeDir "start-bridge.ps1"
$LogRoot = Join-Path $env:LOCALAPPDATA "cursor-dingtalk-bridge\logs"
$StdoutLog = Join-Path $LogRoot "stdout.log"
$StderrLog = Join-Path $LogRoot "stderr.log"

if (-not (Test-Path (Join-Path $BridgeDir "env.local.ps1"))) {
  Write-Host "请先: Copy-Item env.local.example.ps1 env.local.ps1 并填写 DINGTALK_SELF_OPEN_ID" -ForegroundColor Yellow
  exit 1
}

$node = Get-Command node -ErrorAction SilentlyContinue
$dws = Get-Command dws -ErrorAction SilentlyContinue
if (-not $node) { Write-Error "未找到 node，请安装 Node.js 并加入 PATH" }
if (-not $dws) { Write-Error "未找到 dws，请先 dws auth login" }

New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null

$pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
$shell = if ($pwsh) { $pwsh.Source } else { (Get-Command powershell).Source }

$actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$StartScript`""
$action = New-ScheduledTaskAction -Execute $shell -Argument $actionArgs
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "已安装并启动计划任务: $TaskName"
Write-Host "  入口: $StartScript"
Write-Host "  日志目录: $LogRoot"
Write-Host "  卸载: .\uninstall-windows.ps1"
Write-Host "  状态: .\status.ps1"
Write-Host ""
Write-Host "说明: 计划任务 stdout/stderr 默认不写文件；调试请前台运行: .\start-bridge.ps1"
