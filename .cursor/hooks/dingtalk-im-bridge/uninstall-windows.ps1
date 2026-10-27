param(
  [string]$TaskName = "CursorDingtalkImBridge"
)

$ErrorActionPreference = "SilentlyContinue"
Stop-ScheduledTask -TaskName $TaskName
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "已卸载计划任务 $TaskName（inbox/state 未删除）"
