import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import copy from 'rollup-plugin-copy';

import pkgJson from './package.json';
import { builtinModules } from 'module';

const external = (pkgJson.dependencies ? Object.keys(pkgJson.dependencies) : [])
  .concat(builtinModules).concat('style9/babel');

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
}]);
