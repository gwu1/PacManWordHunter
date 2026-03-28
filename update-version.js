#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get current git info
const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
const commitDate = execSync('git log -1 --format="%cd" --date=short', { encoding: 'utf8' }).trim();

// Read the game.js file
const gameJsPath = './game.js';
let gameJsContent = fs.readFileSync(gameJsPath, 'utf8');

// Update the version display function
const versionRegex = /displayVersion\(\) \{[\s\S]*?const versionInfo = \{[\s\S]*?\};/;
const newVersionInfo = `displayVersion() {
        // Auto-generated version info
        const versionInfo = {
            date: '${commitDate}',
            hash: '${commitHash}',
            shortHash: '${commitHash}'
        };`;

gameJsContent = gameJsContent.replace(versionRegex, newVersionInfo);

// Write back to file
fs.writeFileSync(gameJsPath, gameJsContent);

console.log(`Version updated to: v${commitDate} (${commitHash})`);
