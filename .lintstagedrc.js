module.exports = {
  '**/*.(ts|tsx)': () => 'pnpm ts-check',
  '**/*.(ts|tsx|js)': () => ['pnpm lint:fix', 'pnpm prettier:fix'],
  '**/*.(md|json)': () => 'pnpm prettier:fix'
};
