import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import copy from 'rollup-plugin-copy';

import pkgJson from './package.json';
import { builtinModules } from 'module';

const externalModules = (pkgJson.dependencies ? Object.keys(pkgJson.dependencies) : [])
  .concat(builtinModules).concat('next');
const external = (id: string) => externalModules.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig([{
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'commonjs'
  },
  plugins: [
    swc(),
    copy({
      targets: [
        { src: 'src/extracted.js', dest: 'dist' }
      ]
    })
  ],
  external
}, {
  input: 'src/virtualFileLoader.ts',
  output: {
    file: 'dist/virtualFileLoader.js',
    format: 'commonjs'
  },
  plugins: [
    swc()
  ],
  external
}, {
  input: 'src/loader.ts',
  output: {
    file: 'dist/loader.js',
    format: 'commonjs'
  },
  plugins: [
    swc()
  ],
  external
}, {
  input: 'src/next.ts',
  output: {
    file: 'dist/next.js',
    format: 'commonjs'
  },
  plugins: [
    swc()
  ],
  external(id: string) {
    const isExternal = external(id);
    if (isExternal) return true;
    return id === './index';
  }
}]);
