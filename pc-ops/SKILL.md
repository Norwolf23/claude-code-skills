---
name: pc-ops
description: Windows system cleanup and optimization. Audits programs, services, startup items, processes, and disk usage. Interactive triage with user decisions at every step.
---

# /pc-ops -- Windows System Maintenance

> Audit, triage, and clean up a Windows machine. User decides what stays and goes.

**Requires**: PowerShell (elevated for service/startup changes)
**Safety**: All destructive actions require user confirmation. Verify after every change.

---

## Core Pattern

Every cleanup follows the same cycle:

```
AUDIT -> TRIAGE -> EXECUTE (elevated) -> VERIFY
```

Never skip VERIFY. Never auto-remove without user consent.

---

## PowerShell in Bash -- Critical Pattern

Windows Bash tool mangles PowerShell `$` variables. Always write scripts to temp files:

```bash
cat > /tmp/script.ps1 << 'EOF'
$var = Get-Something
# ... PowerShell code with $ intact
EOF
powershell -ExecutionPolicy Bypass -File /tmp/script.ps1
```

For elevated operations (services, HKLM registry, scheduled tasks):

```bash
cat > /tmp/admin-script.ps1 << 'EOF'
# ... operations needing admin
Write-Output "DONE" | Out-File "$env:TEMP\result.txt"
EOF
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File','C:\Users\$env:USERNAME\AppData\Local\Temp\admin-script.ps1' -Verb RunAs -Wait"
# Then check result:
cat "$TEMP/result.txt"
```

---

## Phase 1: Audit Programs

List all installed software from three sources:

```powershell
# 64-bit programs (HKLM)
Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* |
  Select-Object DisplayName, DisplayVersion, EstimatedSize |
  Where-Object { $_.DisplayName -ne $null } | Sort-Object DisplayName

# 32-bit programs (WOW6432Node)
Get-ItemProperty HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* |
  Select-Object DisplayName, DisplayVersion, EstimatedSize |
  Where-Object { $_.DisplayName -ne $null } | Sort-Object DisplayName

# UWP / Store apps
Get-AppxPackage | Where-Object { $_.IsFramework -eq $false } |
  Select-Object Name, Version | Sort-Object Name
```

**Triage categories**:
- Redundant (old version when new exists, e.g. Illustrator 2025 + 2026)
- Bloatware (OEM pre-installed: McAfee, Dropbox OEM, etc.)
- Unused (installed but never/rarely used)
- Duplicate purpose (multiple remote access tools, multiple browsers)

**Uninstall via**:
- `winget uninstall --id <ID>` (preferred, use `winget list --name "X"` to find ID)
- `Get-AppxPackage -Name 'X' | Remove-AppxPackage` (for UWP/Store apps)

---

## Phase 2: Audit Disk Usage

```powershell
# Drive space
Get-PSDrive C | Format-List Used, Free

# Home folder breakdown (top-level dirs)
$folders = @('Desktop','Documents','Downloads','projects','AppData',
  'OneDrive','Videos','Music','Pictures','Archive','.docker')
foreach($f in $folders) {
  $p = Join-Path $env:USERPROFILE $f
  if(Test-Path $p) {
    $s = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue |
      Measure-Object -Property Length -Sum).Sum
    '{0,-20} {1,8:N1} GB' -f $f, ($s/1GB)
  }
}

# AppData breakdown (folders over 100MB)
$root = $env:LOCALAPPDATA
Get-ChildItem $root -Directory | ForEach-Object {
  $s = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
  if($s -gt 100MB) { [PSCustomObject]@{Folder=$_.Name; 'Size(GB)'=[math]::Round($s/1GB,2)} }
} | Sort-Object 'Size(GB)' -Descending
```

**Common space hogs**: npm-cache, Docker, browser caches, Unity game data, Temp folder, ISOs in Downloads.

**Safe cleanups** (re-downloadable):
- `npm cache clean --force`
- `pip cache purge`
- Delete old Temp files
- `docker system prune -a` (requires Docker running)

---

## Phase 3: Audit Running Processes

```powershell
# Top processes by RAM
Get-Process | Sort-Object WorkingSet64 -Descending |
  Select-Object -First 20 Name, @{N='RAM(MB)';E={[math]::Round($_.WorkingSet64/1MB)}},
  @{N='CPU(s)';E={[math]::Round($_.CPU,1)}}, Id

# Node processes with command lines (common bloat source)
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
  $wmi = Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)"
  [PSCustomObject]@{
    PID = $_.Id
    'RAM(MB)' = [math]::Round($_.WorkingSet64/1MB)
    CommandLine = $wmi.CommandLine.Substring(0, [Math]::Min($wmi.CommandLine.Length, 100))
  }
}
```

**Kill bloat processes**: `Stop-Process -Id <PID> -Force` (or elevated if access denied).

---

## Phase 4: Audit Services

```powershell
# Non-Microsoft running services
Get-Service | Where-Object { $_.Status -eq 'Running' } | ForEach-Object {
  $wmi = Get-WmiObject Win32_Service -Filter "Name='$($_.Name)'"
  if ($wmi.PathName -and $wmi.PathName -notmatch 'Windows\\system32|svchost') {
    [PSCustomObject]@{
      Name = $_.DisplayName
      StartType = $_.StartType
      Path = $wmi.PathName.Substring(0, [Math]::Min($wmi.PathName.Length, 80))
    }
  }
} | Sort-Object Name
```

**Service actions** (require admin):
- `Set-Service -Name X -StartupType Manual` (start on demand)
- `Set-Service -Name X -StartupType Disabled` (never start)
- `Stop-Service -Name X -Force` (stop now)

**Common useless services**: Logi Options+ (huge CPU hog), ExpressVPN (3 services when idle), Nahimic (audio bloatware), OEM telemetry.

---

## Phase 5: Audit Startup Items

Five vectors where things auto-start on Windows:

```powershell
# 1. HKCU Run (user login)
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'

# 2. HKLM Run (system boot) -- needs admin to modify
Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'

# 3. Scheduled Tasks (non-Microsoft, enabled)
Get-ScheduledTask | Where-Object {
  $_.State -eq 'Ready' -and $_.TaskPath -notlike '\Microsoft\*'
} | Select-Object TaskName, State

# 4. Services set to Automatic
Get-Service | Where-Object { $_.StartType -eq 'Automatic' }

# 5. StartupApproved registry keys
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
```

**Disable startup items**:
- Registry: `Remove-ItemProperty -Path 'HKCU:\...\Run' -Name 'X'`
- Tasks: `Disable-ScheduledTask -TaskName 'X'` (admin)
- Services: `Set-Service -Name X -StartupType Manual` (admin)
- StartupApproved: `Remove-ItemProperty -Path '...\StartupApproved\Run' -Name 'X'`

---

## Phase 6: Summarize

After all changes, produce a summary table:

| Category | Action | Items |
|----------|--------|-------|
| Programs uninstalled | count + names | estimated space freed |
| Services disabled | count | before/after startup type |
| Startup items removed | count | which vectors cleaned |
| Processes killed | count | RAM freed |

---

## Common Bloat on OEM Laptops

**Common bloatware to look for**:
- McAfee WebAdvisor, Dropbox OEM, Nahimic, OEM diagnostic tools
- Logi Options+ (246+ MB RAM, 300+ CPU seconds -- massive resource hog)

**Logi Options+ note**: Disabling frees significant resources and can fix KVM/remote desktop lag. Windows HID drivers handle mouse/keyboard fine without it. Disable via: services (logi_lamparray_service, OptionsPlusUpdaterService) + HKLM Run entry (Logitech Download Assistant).

---

## Origin

Extracted from a real system cleanup session (Feb 2026). Full audit of an OEM laptop: 7 programs uninstalled, 12 services disabled, 6 scheduled tasks disabled, 5 startup entries removed. Identified Logi Options+ as root cause of KVM lag.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
