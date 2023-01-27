import path from 'path';
import babel from '@babel/core';
import loaderUtils from 'loader-utils';
import { stringifyRequest } from '../lib/stringify-request';
import { NAME } from '../lib/constants';

import babelPlugin from 'style9/babel';
import { serializeCss } from '../lib/serialize-css';
import type webpack from 'webpack';

const emptyCssExtractionFile = require.resolve('./virtual.next.style9.css');

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
      sourceMaps: !!this.sourceMap,
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
      const request = stringifyRequest(
        this,
        // Next.js RSC CSS extraction will discard any loaders in the request.
        // So we need to pass virtual css information through resourceQuery.
        // https://github.com/vercel/next.js/blob/3a9bfe60d228fc2fd8fe65b76d49a0d21df4ecc7/packages/next/src/build/webpack/plugins/flight-client-entry-plugin.ts#L425-L429
        `${emptyCssExtractionFile}?${JSON.stringify({ fileName: cssPath, source: serializedCss })}`
      );

      const postfix = `\nimport ${request};`;
      callback(null, code + postfix, map ?? undefined);
    }
  } catch (error) {
    callback(error as Error);
  }
}
