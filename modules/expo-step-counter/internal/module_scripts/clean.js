#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
