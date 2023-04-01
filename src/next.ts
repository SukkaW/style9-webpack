import nextMiniCssExtractPluginExports from 'next/dist/build/webpack/plugins/mini-css-extract-plugin';
import { findPagesDir } from 'next/dist/lib/find-pages-dir';
import browserslist from 'next/dist/compiled/browserslist';
import { lazyPostCSS } from 'next/dist/build/webpack/config/blocks/css';
import { warn } from 'next/dist/build/output/log';

import type { NextConfig, WebpackConfigContext } from 'next/dist/server/config-shared';

import Style9Plugin from './index';
import type webpack from 'webpack';
import type { RuleSetRule } from 'webpack';

type RuleOptions = Omit<RuleSetRule, 'use'>;

/** Next.js' precompilation add "__esModule: true", but doesn't add an actual default exports */
// @ts-expect-error -- Next.js fucks something up
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Next.js fucks something up
const NextMiniCssExtractPlugin: typeof import('next/dist/build/webpack/plugins/mini-css-extract-plugin') = nextMiniCssExtractPluginExports.default;

// Adopted from https://github.com/vercel/next.js/blob/1f1632979c78b3edfe59fd85d8cce62efcdee688/packages/next/build/webpack-config.ts#L60-L72
function getSupportedBrowsers(dir: string, isDevelopment: boolean) {
  try {
    return browserslist.loadConfig({
      path: dir,
      env: isDevelopment ? 'development' : 'production'
    });
  } catch (_) {
    return undefined;
  }
}

const cssLoader = (() => {
  try {
    // v12+
    return require.resolve('next/dist/build/webpack/loaders/css-loader/src');
  } catch (_) {
    warn('Next.js built-in css-loader is not found, will fallback to "css-loader"');
    return 'css-loader';
  }
})();

const getNextMiniCssExtractPlugin = (isDev: boolean) => {
  // Use own MiniCssExtractPlugin to ensure HMR works
  // v9 has issues when using own plugin in production
  // v10.2.1 has issues when using built-in plugin in development since it
  // doesn't bundle HMR files
  // v12.1.7 finaly fixes the issue by adding the missing hmr/hotModuleReplacement.js file
  if (isDev) {
    try {
      // Check if hotModuleReplacement exists
      require('next/dist/compiled/mini-css-extract-plugin/hmr/hotModuleReplacement');
      return NextMiniCssExtractPlugin;
    } catch (_) {
      warn('Next.js built-in mini-css-extract-plugin is broken, will fallback to "mini-css-extract-plugin"');
      return require('mini-css-extract-plugin');
    }
  }
  // Always use Next.js built-in MiniCssExtractPlugin in production
  return NextMiniCssExtractPlugin;
};
// Adopt from Next.js' getGlobalCssLoader
// https://github.com/vercel/next.js/blob/d61b0761efae09bd9cb1201ff134ed8950d9deca/packages/next/src/build/webpack/config/blocks/css/loaders/global.ts#L7

function getStyle9VirtualCssLoader(options: WebpackConfigContext, MiniCssExtractPlugin: typeof NextMiniCssExtractPlugin) {
  const loaders: webpack.RuleSetUseItem[] = [];

  // Adopt from Next.js' getClientStyleLoader
  // https://github.com/vercel/next.js/blob/d61b0761efae09bd9cb1201ff134ed8950d9deca/packages/next/src/build/webpack/config/blocks/css/loaders/client.ts#L3
  if (!options.isServer) {
    loaders.push({
      loader: (MiniCssExtractPlugin as any).loader,
      options: {
        publicPath: `${(options as any).assetPrefix}/_next/`,
        esModule: false
      }
    });
  }

  const postcss = () => lazyPostCSS(
    options.dir,
    getSupportedBrowsers(options.dir, options.dev),
    undefined
  );

  loaders.push({
    // https://github.com/vercel/next.js/blob/0572e218afe130656be53f7367bf18c4ea389f7d/packages/next/build/webpack/config/blocks/css/loaders/global.ts#L29-L38
    loader: cssLoader,
    options: {
      // https://github.com/vercel/next.js/blob/88a5f263f11cb55907f0d89a4cd53647ee8e96ac/packages/next/build/webpack/config/blocks/css/index.ts#L142-L147
      postcss,
      importLoaders: 1,
      modules: false
    }
  });

  loaders.push({
    loader: require.resolve('next/dist/build/webpack/loaders/postcss-loader/src'),
    options: {
      postcss
    }
  });

  return loaders;
}

module.exports = (pluginOptions = {}, _ruleOptions: RuleOptions = {}) => (nextConfig: NextConfig = {}) => {
  const ruleOptions = {
    test: /\.(tsx|ts|js|mjs|jsx)$/,
    exclude: /node_modules/,
    ..._ruleOptions
  };
  return {
    ...nextConfig,
    webpack(config: any, ctx: WebpackConfigContext) {
      const findPagesDirResult = findPagesDir(
        ctx.dir,
        !!(nextConfig.experimental && nextConfig.experimental.appDir)
      );

      // https://github.com/vercel/next.js/blob/1fb4cad2a8329811b5ccde47217b4a6ae739124e/packages/next/build/index.ts#L336
      // https://github.com/vercel/next.js/blob/1fb4cad2a8329811b5ccde47217b4a6ae739124e/packages/next/build/webpack-config.ts#L626
      // https://github.com/vercel/next.js/pull/43916
      const hasAppDir
        // on Next.js 12, findPagesDirResult is a string. on Next.js 13, findPagesDirResult is an object
        = !!(nextConfig.experimental && nextConfig.experimental.appDir)
        && !!(findPagesDirResult && findPagesDirResult.appDir);

      // TODO: remove this warning once Next.js has fixed the issue, and 2 plugins merges
      if (hasAppDir) {
        warn(
          'It seems that you are using Next.js 13 beta appDir feature.'
          + '\n'
          + 'Currently, "style9-webpack/next" doesn\'t work well with Next.js appDir when "style9.create" is used in Server Components, '
          + 'due to a Next.js internal implementation detail. '
          + 'See https://github.com/SukkaW/style9-webpack/issues/1 for more information.'
          + '\n'
          + 'In the meantime, you can use "style9-webpack/next-appdir" instead. It is a plugin specially designed to workaround the Next.js internal implementation quirk and can work with Next.js 13 beta appDir perfectly.'
        );
      }

      const outputCSS = hasAppDir
        // When there is appDir, always output css, even on server (React Server Component is also server)
        ? true
        // There is no appDir, do not output css on server build
        : !ctx.isServer;

      // The style9 compiler must run on source code, which means it must be
      // configured as the last loader in webpack so that it runs before any
      // other transformation.

      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, ctx);
      }

      // For some reason, Next 11.0.1 has `config.optimization.splitChunks`
      // set to `false` when webpack 5 is enabled.
      config.optimization.splitChunks = config.optimization.splitChunks || {
        cacheGroups: {}
      };

      const MiniCssExtractPlugin = getNextMiniCssExtractPlugin(ctx.dev);

      config.module.rules.push({
        ...ruleOptions,
        use: [
          {
            loader: Style9Plugin.loader,
            options: {
              // Here we configure a custom virtual css file name, for later matches
              virtualFileName: '[path][name].[hash:base64:7].style9.css',
              outputCSS,
              ...pluginOptions
            }
          }
        ]
      });

      // Based on https://github.com/vercel/next.js/blob/88a5f263f11cb55907f0d89a4cd53647ee8e96ac/packages/next/build/webpack/config/helpers.ts#L12-L18
      const cssRules = config.module.rules.find(
        (rule: any) => Array.isArray(rule.oneOf)
          && rule.oneOf.some(
            ({ test }: any) => typeof test === 'object'
              && typeof test.test === 'function'
              && test.test('filename.css')
          )
      ).oneOf;

      // Here we matches virtual css file emitted by Style9Plugin
      cssRules.unshift({
        test: /\.style9.css$/,
        use: getStyle9VirtualCssLoader(ctx, MiniCssExtractPlugin)
      });

      if (outputCSS) {
        config.optimization.splitChunks ||= {};
        config.optimization.splitChunks.cacheGroups ||= {};

        config.optimization.splitChunks.cacheGroups.style9 = {
          name: 'style9',
          // We apply cacheGroups to style9 virtual css only
          test: /extracted\.style9\.css$/,
          chunks: 'all',
          type: 'css/mini-extract',
          enforce: true
        };

        // Style9 need to emit the css file on both server and client, both during the
        // development and production.
        // However, Next.js only add MiniCssExtractPlugin on client + production.
        //
        // To simplify the logic at our side, we will add MiniCssExtractPlugin based on
        // the "instanceof" check (We will only add our required MiniCssExtractPlugin if
        // Next.js hasn't added it yet).
        // This also prevent multiple MiniCssExtractPlugin being added (which will cause
        // RealContentHashPlugin to panic)
        if (
          !config.plugins.some((plugin: unknown) => plugin instanceof MiniCssExtractPlugin)
        ) {
          // HMR reloads the CSS file when the content changes but does not use
          // the new file name, which means it can't contain a hash.
          const filename = ctx.dev
            ? 'static/css/[name].css'
            : 'static/css/[contenthash].css';

          // Logic adopted from https://git.io/JtdBy
          config.plugins.push(
            new MiniCssExtractPlugin({
              filename,
              chunkFilename: filename,
              // Next.js guarantees that CSS order "doesn't matter", due to imposed
              // restrictions:
              // 1. Global CSS can only be defined in a single entrypoint (_app)
              // 2. CSS Modules generate scoped class names by default and cannot
              //    include Global CSS (:global() selector).
              //
              // While not a perfect guarantee (e.g. liberal use of `:global()`
              // selector), this assumption is required to code-split CSS.
              //
              // As for Style9, the CSS is always atomic (so classes are always unique),
              // and Style9 Plugin will always sort the css based on media query and pseudo
              // selector.
              //
              // If this warning were to trigger, it'd be unactionable by the user,
              // but likely not valid -- so just disable it.
              ignoreOrder: true
            })
          );
        }

        config.plugins.push(new Style9Plugin());
      }

      return config;
    }
  };
};
