# ============================================
# Step 1: Get Deployment Group Name
# ============================================
$deploymentGroup = $env:DEPLOYMENT_GROUP_NAME

Write-Host "========================================="
Write-Host "Deployment Group : $deploymentGroup"
Write-Host "========================================="

if (-not $deploymentGroup) {
    Write-Error "DEPLOYMENT_GROUP_NAME is empty or not set!"
    exit 1
}

# ============================================
# Step 2: Map Group Name to Environment
# ============================================
switch ($deploymentGroup) {
    "idealiAPP-Staging-Group"    { 
        $environment   = "staging"
        $iisFolderName = "app.staging.ideali.io"
    }
    "idealiAPP-Testing-Group"    { 
        $environment   = "testing"
        $iisFolderName = "app.testing.ideali.io"
    }
    "idealiAPP-Production-Group" { 
        $environment   = "production"
        $iisFolderName = "app.ideali.io"
    }
    default {
        Write-Error "Unknown deployment group: '$deploymentGroup'"
        exit 1
    }
}

# ============================================
# Step 3: Define Paths (ALL FIXED HERE)
# ============================================
$baseRoot        = "C:\inetpub\wwwroot\ideali.io"                  # ← base root
$sourcePath      = "$baseRoot\_deployment_temp"                     # ← temp folder
$destinationPath = "$baseRoot\$iisFolderName"                      # ← correct IIS folder
$backupPath      = "$baseRoot\_backup_$environment"                 # ← backup folder

Write-Host "========================================="
Write-Host "Deployment Group : $deploymentGroup"
Write-Host "Environment      : $environment"
Write-Host "IIS Folder       : $iisFolderName"
Write-Host "Source           : $sourcePath"
Write-Host "Destination      : $destinationPath"
Write-Host "========================================="

# ============================================
# Step 4: Validate Source Exists
# ============================================
if (!(Test-Path $sourcePath)) {
    Write-Error "Source path not found: $sourcePath"
    exit 1
}

Write-Host "Source path verified."
Write-Host "Files in source:"
Get-ChildItem $sourcePath | ForEach-Object { Write-Host "  $($_.Name)" }

# ============================================
# Step 5: Create Destination if Not Exists
# ============================================
if (!(Test-Path $destinationPath)) {
    Write-Host "Creating destination: $destinationPath"
    New-Item -ItemType Directory -Path $destinationPath | Out-Null
}

# ============================================
# Step 6: Backup Preserved Files
# ============================================
$preserve = @(
    "web.config",
    "ideas-registration-logo-group-white 2.png",
    "asset-manifest.json"
)

if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
}

Write-Host "Backing up preserved files..."
foreach ($file in $preserve) {
    $filePath = Join-Path $destinationPath $file
    if (Test-Path $filePath) {
        Copy-Item $filePath $backupPath -Force
        Write-Host "  Backed up : $file"
    } else {
        Write-Host "  Not found (skip) : $file"
    }
}

# ============================================
# Step 7: Clean Old Build
# ============================================
Write-Host "Cleaning old build..."

Get-ChildItem $destinationPath -Recurse -File -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem $destinationPath -Recurse -Directory -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Old build cleaned."

# ============================================
# Step 8: Copy New Build Files
# ============================================
Write-Host "Copying new build files..."

Copy-Item -Path "$sourcePath\*" `
          -Destination $destinationPath `
          -Recurse `
          -Force `
          -Exclude @("appspec.yml", "scripts")

Write-Host "Files copied. Verifying..."
Write-Host "Files in destination:"
Get-ChildItem $destinationPath | ForEach-Object { Write-Host "  $($_.Name)" }

# ============================================
# Step 9: Restore Preserved Files
# ============================================
Write-Host "Restoring preserved files..."
foreach ($file in $preserve) {
    $backupFile = Join-Path $backupPath $file
    if (Test-Path $backupFile) {
        Copy-Item $backupFile $destinationPath -Force
        Write-Host "  Restored : $file"
    }
}

Remove-Item $backupPath -Recurse -Force -ErrorAction SilentlyContinue

# ============================================
# Step 10: Validate
# ============================================
Write-Host "Validating deployment..."

$index = Join-Path $destinationPath "index.html"

if (!(Test-Path $index)) {
    Write-Error "VALIDATION FAILED: index.html not found at $index"
    exit 1
}

Write-Host "Validation passed."

# ============================================
# Step 11: Restart IIS
# ============================================
Write-Host "Restarting IIS..."
iisreset

# ============================================
# Step 12: Cleanup Temp
# ============================================
Write-Host "Cleaning temp folder..."
Remove-Item $sourcePath -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "========================================="
Write-Host "Deployment Successful!"
Write-Host "Group       : $deploymentGroup"
Write-Host "Environment : $environment"
Write-Host "Path        : $destinationPath"
Write-Host "========================================="