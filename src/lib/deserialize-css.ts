import { gunzip } from 'zlib';
import { promisify } from 'util';
import { SERIALIZE_COMPRESSION_FLAG } from './constants';

const unzip = promisify(gunzip);

export async function deserializeCss(source: string) {
  if (source.startsWith(SERIALIZE_COMPRESSION_FLAG)) {
    const decompressedSource = await unzip(
      Buffer.from(source.substring(SERIALIZE_COMPRESSION_FLAG.length), 'base64')
    );

    return decompressedSource.toString('utf-8');
  }
  return Buffer.from(source, 'base64').toString('utf-8');
}
