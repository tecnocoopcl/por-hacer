import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const external = [
  'react',
  'react/jsx-runtime',
  /^baseui\//,
  'styletron-react',
];

const babelConfig = {
  babelHelpers: 'bundled',
  presets: [
    ['@babel/preset-env', { targets: '>0.2%, not dead', modules: false }],
    ['@babel/preset-react', { runtime: 'classic' }],
  ],
  extensions: ['.js', '.jsx'],
};

export default [
  {
    input: 'src/index.js',
    external,
    plugins: [resolve({ extensions: ['.js', '.jsx'] }), babel(babelConfig)],
    output: { file: 'dist/index.js', format: 'cjs', exports: 'named' },
  },
  {
    input: 'src/index.js',
    external,
    plugins: [resolve({ extensions: ['.js', '.jsx'] }), babel(babelConfig)],
    output: { file: 'dist/index.esm.js', format: 'esm' },
  },
];
