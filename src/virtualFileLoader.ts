import { deserializeCss } from './lib/serialize';
import { getOptions } from './lib/loader-options';

export default function (this: any) {
  const { source } = getOptions(this);
  const callback = this.async();

  deserializeCss(source as string).then((deserializedCss) => {
    callback(null, deserializedCss);
  });
}
