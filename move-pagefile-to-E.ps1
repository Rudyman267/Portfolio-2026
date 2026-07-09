# Moves the Windows pagefile OFF C: and onto E: with a larger fixed size.
# Fixes the "paging file too small" crash from the Turbopack dev compile.
# Fully reversible: see the UNDO block at the bottom of this file.
#
# Run this AS ADMINISTRATOR. It requires a reboot to take effect.

# --- Safety: must be elevated ---
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$p  = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This must be run as Administrator. Right-click -> Run as administrator." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "Current pagefile config:" -ForegroundColor Cyan
Get-CimInstance Win32_PageFileUsage | Select-Object Name, AllocatedBaseSize | Format-Table -AutoSize

# --- Step 1: stop Windows auto-managing the pagefile ---
$cs = Get-CimInstance Win32_ComputerSystem
if ($cs.AutomaticManagedPagefile) {
    $cs | Set-CimInstance -Property @{ AutomaticManagedPagefile = $false }
    Write-Host "Disabled auto-managed pagefile." -ForegroundColor Green
}

# --- Step 2: remove the pagefile on C: ---
$cPage = Get-CimInstance Win32_PageFileSetting -Filter "Name='C:\\\\pagefile.sys'" -ErrorAction SilentlyContinue
if ($cPage) {
    $cPage | Remove-CimInstance
    Write-Host "Removed pagefile setting on C:." -ForegroundColor Green
} else {
    Write-Host "No explicit C: pagefile setting found (auto-managed); it will be dropped on reboot." -ForegroundColor Yellow
}

# --- Step 3: create a fixed pagefile on E: (16 GB initial / 24 GB max) ---
New-CimInstance -ClassName Win32_PageFileSetting -Property @{
    Name        = 'E:\pagefile.sys'
    InitialSize = 16384
    MaximumSize = 24576
} | Out-Null
Write-Host "Created fixed pagefile on E: (16384 MB initial / 24576 MB max)." -ForegroundColor Green

Write-Host ""
Write-Host "New configured pagefile settings:" -ForegroundColor Cyan
Get-CimInstance Win32_PageFileSetting | Select-Object Name, InitialSize, MaximumSize | Format-Table -AutoSize

Write-Host ""
Write-Host "DONE. You must REBOOT for this to take effect." -ForegroundColor Green
Read-Host "Press Enter to close"

# ============================================================
# UNDO (run these as admin, then reboot, to restore defaults):
#
#   Get-CimInstance Win32_PageFileSetting -Filter "Name='E:\\\\pagefile.sys'" | Remove-CimInstance
#   Get-CimInstance Win32_ComputerSystem | Set-CimInstance -Property @{ AutomaticManagedPagefile = $true }
#
# That puts a Windows-managed pagefile back on C: and removes the E: one.
# ============================================================
