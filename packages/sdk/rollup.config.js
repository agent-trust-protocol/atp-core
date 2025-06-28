import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'crypto',
  'fs',
  'path',
  'url',
  'buffer',
  'stream',
  'util',
  'events',
  'http',
  'https',
  'net',
  'tls',
  'zlib'
];

const commonPlugins = [
  nodeResolve({
    preferBuiltins: true,
    exportConditions: ['node']
  }),
  commonjs(),
  typescript({
    declaration: false,
    declarationMap: false
  })
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: commonPlugins
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: commonPlugins
  },
  
  // Main build (ESM)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        declaration: true,
        declarationDir: 'dist',
        declarationMap: true
      })
    ]
  }
];