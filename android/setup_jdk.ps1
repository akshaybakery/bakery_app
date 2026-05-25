# setup_jdk.ps1
# This script downloads and extracts a portable JDK 21 using curl.exe for maximum speed.

$ErrorActionPreference = "Stop"

$url = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
$zipPath = Join-Path $PSScriptRoot "jdk.zip"
$extractPath = Join-Path $PSScriptRoot "jdk21"

# Create destination directory if it doesn't exist
if (Test-Path $extractPath) {
    Write-Host "Removing existing jdk21 folder..."
    Remove-Item -Recurse -Force $extractPath
}
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null

Write-Host "Downloading portable JDK 21 from Adoptium using curl.exe..."
# Use curl.exe directly which bypasses PowerShell's slow progress rendering
& curl.exe -L -o $zipPath $url

Write-Host "Extracting JDK..."
$ProgressPreference = 'SilentlyContinue'
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "Locating bin/jlink.exe..."
$jlink = Get-ChildItem -Path $extractPath -Filter "jlink.exe" -Recurse
if ($jlink) {
    $jdkHome = $jlink.Directory.Parent.FullName
    Write-Host "JDK successfully installed at: $jdkHome"
    
    # Write the discovered JDK path to a properties file for the build runner
    Set-Content -Path (Join-Path $PSScriptRoot "jdk_path.txt") -Value $jdkHome
} else {
    throw "jlink.exe was not found in the extracted files."
}

Write-Host "Cleaning up zip file..."
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "JDK 21 setup complete!"
