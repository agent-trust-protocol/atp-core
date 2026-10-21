// Share the repository's ESM dependency transforms and canonical DID mapping.
// A package-only run must exercise the same source resolution as root CI.
import rootConfig from '../../jest.config.cjs';
import { fileURLToPath } from 'node:url';

const transform = Object.fromEntries(Object.entries(rootConfig.transform).map(([pattern, [engine, options]]) => [pattern, [engine, {
  ...options,
  tsconfig: { ...options.tsconfig, rootDir: fileURLToPath(new URL('../..', import.meta.url)), types: ['node', 'jest'] }
}]]));

export default {
  ...rootConfig,
  transform,
  rootDir: '../..',
  roots: ['<rootDir>/packages/shared/src']
};
