#!/bin/bash

# Get current git info
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_DATE=$(git log -1 --format="%cd" --date=short)

# Update version in game.js
sed -i '' "s/date: '[^']*'/date: '$COMMIT_DATE'/" game.js
sed -i '' "s/hash: '[^']*'/hash: '$COMMIT_HASH'/" game.js
sed -i '' "s/shortHash: '[^']*'/shortHash: '$COMMIT_HASH'/" game.js

# Update cache-busting version in HTML
sed -i '' "s/\?v=[^\"]*/?v=$COMMIT_HASH/" index.html

echo "Version updated to: v$COMMIT_DATE ($COMMIT_HASH)"
