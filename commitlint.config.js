// Conventional Commits — enforce structured commit messages.
// Format:  <type>(<scope>): <subject>
// Example: feat(login): add password strength meter
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'style',
        'i18n',
        'test',
        'chore',
        'docs',
        'ci',
        'refactor',
        'perf',
        'build',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
