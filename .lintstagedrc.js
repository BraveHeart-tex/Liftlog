module.exports = {
  '**/*.{ts,tsx,js}': stagedFiles => [
    `pnpm exec eslint --fix ${stagedFiles.join(' ')}`,
    `pnpm exec prettier --write ${stagedFiles.join(' ')}`
  ],
  '**/*.{md,json}': stagedFiles =>
    `pnpm exec prettier --write ${stagedFiles.join(' ')}`
};
