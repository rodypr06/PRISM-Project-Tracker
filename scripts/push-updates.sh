#!/bin/bash
# Push updates to GitHub
# Usage: ./scripts/push-updates.sh

echo "Pushing updates to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. You may need to authenticate."
    echo "Run: git push origin main"
fi
