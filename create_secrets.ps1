# PowerShell script to create GitHub secrets from cert files

Write-Host "Creating GitHub Secrets from cert files..." -ForegroundColor Green
Write-Host ""

# Create secrets directory if it doesn't exist
if (!(Test-Path "secrets")) {
    New-Item -ItemType Directory -Path "secrets" | Out-Null
    Write-Host "Created secrets directory" -ForegroundColor Green
}

# Function to convert file to base64
function ConvertTo-Base64($filePath) {
    if (Test-Path $filePath) {
        return [Convert]::ToBase64String([IO.File]::ReadAllBytes($filePath))
    } else {
        Write-Host "Warning: File not found - $filePath" -ForegroundColor Yellow
        return ""
    }
}

# Read URL files as plain text
function Read-TextFile($filePath) {
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        # Remove any trailing newlines/whitespace
        return $content.Trim()
    } else {
        Write-Host "Warning: File not found - $filePath" -ForegroundColor Yellow
        return ""
    }
}

Write-Host "Processing certificate files..." -ForegroundColor Cyan

# Process CA certificate
$ca_crt = ConvertTo-Base64 "certs\ca.crt"
if ($ca_crt) {
    Write-Host "✓ CA_CRT processed" -ForegroundColor Green
    $ca_crt | Out-File -FilePath "secrets\CA_CRT.txt" -NoNewline
}

# Process hame-2024 files
$hame_2024_url = Read-TextFile "certs\hame-2024-url"
if ($hame_2024_url) {
    Write-Host "✓ HAME_2024_URL processed" -ForegroundColor Green
    $hame_2024_url | Out-File -FilePath "secrets\HAME_2024_URL.txt" -NoNewline
}

$hame_2024_crt = ConvertTo-Base64 "certs\hame-2024.crt"
if ($hame_2024_crt) {
    Write-Host "✓ HAME_2024_CRT processed" -ForegroundColor Green
    $hame_2024_crt | Out-File -FilePath "secrets\HAME_2024_CRT.txt" -NoNewline
}

$hame_2024_key = ConvertTo-Base64 "certs\hame-2024.key"
if ($hame_2024_key) {
    Write-Host "✓ HAME_2024_KEY processed" -ForegroundColor Green
    $hame_2024_key | Out-File -FilePath "secrets\HAME_2024_KEY.txt" -NoNewline
}

# Process hame-2025 files
$hame_2025_url = Read-TextFile "certs\hame-2025-url"
if ($hame_2025_url) {
    Write-Host "✓ HAME_2025_URL processed" -ForegroundColor Green
    $hame_2025_url | Out-File -FilePath "secrets\HAME_2025_URL.txt" -NoNewline
}

$hame_2025_crt = ConvertTo-Base64 "certs\hame-2025.crt"
if ($hame_2025_crt) {
    Write-Host "✓ HAME_2025_CRT processed" -ForegroundColor Green
    $hame_2025_crt | Out-File -FilePath "secrets\HAME_2025_CRT.txt" -NoNewline
}

$hame_2025_key = ConvertTo-Base64 "certs\hame-2025.key"
if ($hame_2025_key) {
    Write-Host "✓ HAME_2025_KEY processed" -ForegroundColor Green
    $hame_2025_key | Out-File -FilePath "secrets\HAME_2025_KEY.txt" -NoNewline
}

$hame_2025_topic_key = Read-TextFile "certs\hame-2025-topic-encryption-key"
if ($hame_2025_topic_key) {
    Write-Host "✓ HAME_2025_TOPIC_KEY processed" -ForegroundColor Green
    $hame_2025_topic_key | Out-File -FilePath "secrets\HAME_2025_TOPIC_KEY.txt" -NoNewline
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Secrets created in 'secrets' directory!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To add these to GitHub:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/rweijnen/hame-relay/settings/secrets/actions"
Write-Host "2. Click 'New repository secret' for each file"
Write-Host "3. Use the secret name (e.g., CA_CRT) and paste the content from the corresponding .txt file"
Write-Host ""
Write-Host "Secret files created:" -ForegroundColor Cyan
Get-ChildItem secrets\*.txt | ForEach-Object { Write-Host "  - $($_.Name)" }