import path from 'path';
import babel from '@babel/core';
import loaderUtils from 'loader-utils';
import babelPlugin from 'style9/babel';
import { serializeCss } from './lib/serialize';

const NAME = 'style9'; // style9

const virtualLoader = require.resolve('./virtualFileLoader');
const emptyCssExtractionFile = require.resolve('./extracted');

export default async function style9Loader(this: any, input: string, inputSourceMap: any) {
  const {
    virtualFileName = '[path][name].[hash:base64:7].style9.css',
    outputCSS = true,
    parserOptions = {
      plugins: ['typescript', 'jsx']
    },
    ...options
  } = loaderUtils.getOptions(this) || {};

  this.async();

  // bail out early if the input doesn't contain "style9"
  if (!input.includes(NAME)) {
    this.callback(null, input, inputSourceMap);
    return;
  }

  try {
    const { code, map, metadata } = (await babel.transformAsync(input, {
      plugins: [[babelPlugin, options]],
      inputSourceMap: inputSourceMap || true,
      sourceFileName: this.resourcePath,
      filename: path.basename(this.resourcePath),
      sourceMaps: true,
      parserOpts: parserOptions as babel.ParserOptions,
      babelrc: false
    }))!;

    if (!outputCSS) {
      this.callback(null, code, map);
    } else if (metadata && !('style9' in metadata)) {
      this.callback(null, input, inputSourceMap);
    } else if (metadata?.style9 === undefined) {
      this.callback(null, input, inputSourceMap);
    } else {
      const cssPath = loaderUtils.interpolateName(this, virtualFileName as string, {
        content: metadata.style9
      });

      const serializedCss = await serializeCss(metadata.style9 as string);
      const virtualResourceLoader = `${virtualLoader}?${JSON.stringify({
        fileName: virtualFileName,
        source: serializedCss
      })}`;

      const request = loaderUtils.stringifyRequest(
        this,
        `${cssPath}!=!${virtualResourceLoader}!${emptyCssExtractionFile}`
      );

      const postfix = `\nimport ${request};`;
      this.callback(null, code + postfix, map);
    }
  } catch (error) {
    this.callback(error);
  }
}
