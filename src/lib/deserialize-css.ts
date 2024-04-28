import { gunzip } from 'zlib';
import { promisify } from 'util';
import { SERIALIZE_COMPRESSION_FLAG } from './constants';

const unzip = promisify(gunzip);

const decoder = new TextDecoder();

export async function deserializeCss(source: string) {
  if (source.startsWith(SERIALIZE_COMPRESSION_FLAG)) {
    const decompressedSource = await unzip(
      base64ToUint8Array(source.substring(SERIALIZE_COMPRESSION_FLAG.length))
    );

    return decompressedSource.toString('utf-8');
  }
  return decoder.decode(base64ToUint8Array(source));
}

function base64ToUint8Array(base64String: string) {
  return Uint8Array.from(globalThis.atob(base64UrlToBase64(base64String)), x => x.codePointAt(0)!);
}

function base64UrlToBase64(base64url: string) {
  return base64url.replaceAll('-', '+').replaceAll('_', '/');
}
