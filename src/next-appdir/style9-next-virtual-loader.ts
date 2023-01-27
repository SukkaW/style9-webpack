import type webpack from 'webpack';
import { deserializeCss } from '../lib/deserialize-css';

export default function (this: webpack.LoaderContext<unknown>) {
  const callback = this.async();
  const json = this.resourceQuery.slice(1);

  try {
    const { source } = JSON.parse(json);
    deserializeCss(source).then((deserializedCss) => {
      callback(null, deserializedCss);
    }).catch((e) => {
      callback(e as Error);
    });
  } catch (e) {
    callback(e as Error);
  }
}
