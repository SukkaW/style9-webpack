import type webpack from 'webpack';
import { deserializeCss } from '../lib/serialize';

export default function (this: webpack.LoaderContext<unknown>) {
  const callback = this.async();
  const json = this.resourceQuery.slice(1);

  try {
    const { source } = JSON.parse(json);
    const callback = this.async();
    deserializeCss(source).then((deserializedCss) => {
      callback(null, deserializedCss);
    });
  } catch (e) {
    callback(e as Error);
  }
}
