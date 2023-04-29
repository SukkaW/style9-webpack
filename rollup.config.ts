import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import copy from 'rollup-plugin-copy';

import pkgJson from './package.json';
import { builtinModules } from 'module';

const externalModules = Object.keys(pkgJson.dependencies)
  .concat(Object.keys(pkgJson.peerDependencies))
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
        { src: 'src/extracted.style9.css', dest: 'dist' }
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
}, {
  input: 'src/next-appdir/index.ts',
  output: {
    file: 'dist/next-appdir/index.js',
    format: 'commonjs'
  },
  plugins: [
    swc(),
    copy({
      targets: [
        { src: 'src/next-appdir/virtual.next.style9.css', dest: 'dist/next-appdir' }
      ]
    })
  ],
  external(id: string) {
    const isExternal = external(id);
    if (isExternal) return true;
    return id === '../index';
  }
}, {
  input: 'src/next-appdir/style9-next-loader.ts',
  output: {
    file: 'dist/next-appdir/style9-next-loader.js',
    format: 'commonjs'
  },
  plugins: [
    swc()
  ],
  external
}, {
  input: 'src/next-appdir/style9-next-virtual-loader.ts',
  output: {
    file: 'dist/next-appdir/style9-next-virtual-loader.js',
    format: 'commonjs'
  },
  plugins: [
    swc()
  ],
  external
}]);
