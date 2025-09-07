#!/bin/bash

echo "Creating GitHub Secrets from cert files..."
echo ""

# Create secrets directory
mkdir -p secrets

# Convert certificates to base64
echo "Processing CA certificate..."
base64 -w0 certs/ca.crt > secrets/CA_CRT.txt
echo "✓ CA_CRT created"

echo "Processing hame-2024 files..."
cat certs/hame-2024-url > secrets/HAME_2024_URL.txt
echo "✓ HAME_2024_URL created"
base64 -w0 certs/hame-2024.crt > secrets/HAME_2024_CRT.txt
echo "✓ HAME_2024_CRT created"
base64 -w0 certs/hame-2024.key > secrets/HAME_2024_KEY.txt
echo "✓ HAME_2024_KEY created"

echo "Processing hame-2025 files..."
cat certs/hame-2025-url > secrets/HAME_2025_URL.txt
echo "✓ HAME_2025_URL created"
base64 -w0 certs/hame-2025.crt > secrets/HAME_2025_CRT.txt
echo "✓ HAME_2025_CRT created"
base64 -w0 certs/hame-2025.key > secrets/HAME_2025_KEY.txt
echo "✓ HAME_2025_KEY created"
cat certs/hame-2025-topic-encryption-key > secrets/HAME_2025_TOPIC_KEY.txt
echo "✓ HAME_2025_TOPIC_KEY created"

echo ""
echo "========================================"
echo "Secrets created in 'secrets' directory!"
echo "========================================"
echo ""
echo "Files created:"
ls -1 secrets/*.txt
echo ""
echo "To add these to GitHub:"
echo "1. Go to: https://github.com/rweijnen/hame-relay/settings/secrets/actions"
echo "2. Click 'New repository secret' for each file"
echo "3. Use the secret name (e.g., CA_CRT) and paste the content from the corresponding .txt file"