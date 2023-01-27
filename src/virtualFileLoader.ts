import type webpack from 'webpack';
import { deserializeCss } from './lib/deserialize-css';

export default function (this: webpack.LoaderContext<{ filename: string, source: string }>) {
  const { source } = this.getOptions();
  const callback = this.async();

  deserializeCss(source).then((deserializedCss) => {
    callback(null, deserializedCss);
  }).catch((e) => {
    callback(e as Error);
  });
}
