const js = require('@eslint/js');

const nodeGlobals = {
  require: 'readonly', module: 'writable', process: 'readonly', console: 'readonly',
  __dirname: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', Buffer: 'readonly',
};
const jestGlobals = {
  describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly', jest: 'readonly',
  beforeAll: 'readonly', afterAll: 'readonly', beforeEach: 'readonly', afterEach: 'readonly',
};

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: nodeGlobals },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      complexity: ['warn', 13],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      eqeqeq: 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...nodeGlobals, ...jestGlobals } },
    rules: { 'max-lines-per-function': 'off' },
  },
];
