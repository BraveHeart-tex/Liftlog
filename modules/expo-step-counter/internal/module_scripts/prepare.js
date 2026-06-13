#!/usr/bin/env node
const { spawnSyncWithAutoShell } = require('./util');
const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
const result = spawnSyncWithAutoShell('tsc', [], { stdio: 'inherit' });
process.exit(result.status ?? 1);
