const config = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'issue-scope': ({ scope }) => {
          const valid = /^#[1-9]\d*$/.test(scope ?? '');

          return [
            valid,
            'Commit scope must be a GitHub issue number (e.g. #123)'
          ];
        }
      }
    }
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'ci',
        'chore',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ],
    'scope-empty': [2, 'never'],
    'scope-case': [0],
    'issue-scope': [2, 'always']
  }
};

export default config;
