import { deserializeCss } from './serialize';
import { getOptions } from 'loader-utils';

export default function (this: any) {
  const { source } = getOptions(this);
  const callback = this.async();

  deserializeCss(source as string).then((deserializedCss) => {
    callback(null, deserializedCss);
  });
}
