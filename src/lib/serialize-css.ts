import { gzip } from 'zlib';
import { promisify } from 'util';
import { SERIALIZE_COMPRESSION_FLAG } from './constants';

const zip = promisify(gzip);

// The byte threshold for applying compression, below which compressing would out-weigh its value.
const compressionThreshold = 1000;

export async function serializeCss(source: string) {
  if (source.length > compressionThreshold) {
    const compressedSource = await zip(source);
    return SERIALIZE_COMPRESSION_FLAG + compressedSource.toString('base64');
  }

  return Buffer.from(source, 'utf-8').toString('base64');
}
