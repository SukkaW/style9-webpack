import path from 'path';
import babel from '@babel/core';
import loaderUtils from 'loader-utils';
import { stringifyRequest } from './lib/stringify-request';
import { NAME } from './lib/constants';

import babelPlugin from 'style9/babel';
import { serializeCss } from './lib/serialize';
import type webpack from 'webpack';

const virtualLoader = require.resolve('./virtualFileLoader');
const emptyCssExtractionFile = require.resolve('./extracted.style9.css');

interface Style9LoaderOptions {
  virtualFileName?: string;
  outputCSS?: boolean;
  parserOptions?: babel.ParserOptions;
}

export default async function style9Loader(this: webpack.LoaderContext<Style9LoaderOptions>, input: string, inputSourceMap: any) {
  const callback = this.async();

  // bail out early if the input doesn't contain "style9"
  if (!input.includes(NAME)) {
    callback(null, input, inputSourceMap);
    return;
  }

  const {
    virtualFileName = '[path][name].[hash:base64:7].style9.css',
    outputCSS = true,
    parserOptions = {
      plugins: ['typescript', 'jsx']
    },
    ...options
  } = this.getOptions() || {};

  try {
    const { code, map, metadata } = (await babel.transformAsync(input, {
      plugins: [[babelPlugin, options]],
      inputSourceMap: inputSourceMap || true,
      sourceFileName: this.resourcePath,
      filename: path.basename(this.resourcePath),
      sourceMaps: true,
      parserOpts: parserOptions,
      babelrc: false
    }))!;

    if (!outputCSS) {
      callback(null, code ?? undefined, map ?? undefined);
    } else if (metadata && !('style9' in metadata)) {
      callback(null, input, inputSourceMap);
    } else if (metadata?.style9 == null) {
      callback(null, input, inputSourceMap);
    } else {
      const cssPath = loaderUtils.interpolateName(
        this,
        virtualFileName,
        {
          content: metadata.style9
        }
      );

      const serializedCss = await serializeCss(metadata.style9 as string);
      const virtualResourceLoader = `${virtualLoader}?${JSON.stringify({
        fileName: cssPath,
        source: serializedCss
      })}`;

      const request = stringifyRequest(
        this,
        `${cssPath}!=!${virtualResourceLoader}!${emptyCssExtractionFile}`
      );

      const postfix = `\nimport ${request};`;
      callback(null, code + postfix, map ?? undefined);
    }
  } catch (error) {
    callback(error as Error);
  }
}
