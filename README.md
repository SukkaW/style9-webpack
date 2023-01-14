# style9-webpack

Created by Johan Holmerin, [style9](https://github.com/johanholmerin/style9) is a CSS-in-JS compiler inspired by Facebook's [stylex](https://www.youtube.com/watch?v=9JZHodNR184), with near-zero runtime, atomic CSS extraction and TypeScript support. Framework agnostic.

style9-webpack is an alternative webpack plugin for style9.

## Motivation

**ATTENTION! Please please please read this first before you install style9-webpack!**

style9 is a a CSS-in-JS compiler, which means you will write your CSS in your JavaScript/JSX/TSX. But unlike other CSS-in-JS solutions, style9 provides an AoT Compiler. style9 will read your source code, collect your style and transform your JS/JSX/TSX, stripping runtime call as much as possible (making the value of `className` a static string literal), and output CSS elsewhere. For more details about how style9 works, please check out [style9's documentation](https://github.com/johanholmerin/style9/blob/master/docs/How-it-works.md).

style9 does provide a webpack plugin. It uses [webpack-virtual-modules](https://github.com/sysgears/webpack-virtual-modules) under the hood. During the compilation, style9 collects your styles and write collected CSS into virtual modules. Those virtual css files will later be extracted by `MiniCssExtractPlugin`.

However, webpack-virtual-modules [doesn't work well with Next.js](https://github.com/vercel/next.js/issues/44266). Next.js launches multiple Webpack Compiler instances to compile its server-side and client-side code separately. And webpack-virtual-modules just doesn't work when it is being shared between multiple Webpack Compiler instances.

I start this project as a Proof of Concept, to see if I can make a webpack plugin for style9 that doesn't require webpack-virtual-modules. I uses the `virtualFileLoader` idea from [Vanilla Extract](https://github.com/vanilla-extract-css/vanilla-extract), another CSS-in-JS compiler. You can found the implementation of Vanilla Extract's `virtualFileLoader` [here](https://github.com/vanilla-extract-css/vanilla-extract/blob/aabb5869a626b7d966814ec8bc322a0392b77561/packages/webpack-plugin/src/virtualFileLoader.ts).

**You will most likely want to use style9's built-in webpack plugin instead. It works well for most of the cases. style9-webpack is just a Proof of Concept.** But if you are using Next.js 13, and you are having trouble with style9's built-in Next.js plugin, you can give style9-webpack a shot.

## Differences

The main differences between style9's built-in webpack plugin and style9-webpack are as follow:

**style9-webpack loader doesn't have `inlineLoader` option**

style9's built-in webpack loader has an `inlineLoader` option. It allows you to chain other webpack loaders (like `css-loader`) to process the collected virtual CSS, like this:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        use: [{
          loader: Style9Plugin.loader,
          options: {
            inlineLoader: `!${MiniCssExtractPlugin.loader}!css-loader`,
            ...otherStyle9Options
          }
        }]
      }
      // ...
    ];
  });
}
```

style9-webpack doesn't support this approach. Instead, you will need an extra rule to provide your loaders:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        use: [{
          loader: Style9Plugin.loader,
          options: {
            // Now style9-webpack will use "xxxx.style9.css" as the virtual css filenames
            virtualFileName: '[path][name].[hash:base64:7].style9.css',
            ...otherStyle9Options
          }
        }]
      },
      // And you create another rule to match the virtual css files. Now you can apply loaders to them.
      {
        test: /\.style9.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      // ...
    ];
  });
}
```

**style9-webpack doesn't supports Gatsby**

You should use style9's built-in gatsby plugin instead. See [style9's documentation](https://github.com/johanholmerin/style9/blob/master/docs/Bundler-plugins.md#gatsby) for usage with Gatsby.

## Installation

```sh
# NPM
npm i style9-webpack
# Yarn
yarn add style9-webpack
# PNPM
pnpm add style9-webpack
```

## Usage

### Webpack

```js
// webpack.config.js
const Style9Plugin = require('style9-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // Collect all styles in a single file - required
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        use: Style9Plugin.loader,
        options: {
          virtualFileName: '[path][name].[hash:base64:7].style9.css', // {string?} optional, default is '[path][name].style9.css'
          parserOptions: {}, // {import('@babel/core').ParserOptions} optional, default is `{ plugins: ['typescript', 'jsx'] }`
          minifyProperties: process.env.NODE_ENV === 'production', // {boolean?} optional, default is false, recommended to enable this option in production
          incrementalClassnames: false, // {boolean?} optional, default is false
        }
      },
      {
        test: /\.style9.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new Style9Plugin(),
    new MiniCssExtractPlugin()
  ]
};
```

### Next.js

```js
// next.config.js
const withStyle9 = require('style9-webpack/next');

module.exports = withStyle9({
  parserOptions: {}, // // {import('@babel/core').ParserOptions} optional, default is `{ plugins: ['typescript', 'jsx'] }`
  minifyProperties: process.env.NODE_ENV === 'production', // {boolean?} optional, default is false, recommended to enable this option in production
  incrementalClassnames: false, // {boolean?} optional, default is false
})({
  // Your Next.js config goes here.
});
```

## Author

**style9-webpack** © [Sukka](https://github.com/SukkaW), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by Sukka with help from contributors ([list](https://github.com/SukkaW/style9-webpack/graphs/contributors)).

> [Personal Website](https://skk.moe) · [Blog](https://blog.skk.moe) · GitHub [@SukkaW](https://github.com/SukkaW) · Telegram Channel [@SukkaChannel](https://t.me/SukkaChannel) · Twitter [@isukkaw](https://twitter.com/isukkaw) · Mastodon [@sukka@acg.mn](https://acg.mn/@sukka) · Keybase [@sukka](https://keybase.io/sukka)
