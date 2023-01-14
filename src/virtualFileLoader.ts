import type webpack from 'webpack';
import { deserializeCss } from './lib/serialize';

export default function (this: webpack.LoaderContext<{ filename: string, source: string }>) {
  const { source } = this.getOptions();
  const callback = this.async();

  deserializeCss(source).then((deserializedCss) => {
    callback(null, deserializedCss);
  });
}
