import { gzip } from 'zlib';
import { promisify } from 'util';
import { SERIALIZE_COMPRESSION_FLAG } from './constants';

const zip = promisify(gzip);

// The byte threshold for applying compression, below which compressing would out-weigh its value.
const compressionThreshold = 1000;

const encoder = new TextEncoder();

export async function serializeCss(source: string) {
  if (source.length > compressionThreshold) {
    const compressedSource = await zip(source);
    return SERIALIZE_COMPRESSION_FLAG + compressedSource.toString('base64');
  }

  return uint8ArrayToBase64(encoder.encode(source));
}

// Reference: https://phuoc.ng/collection/this-vs-that/concat-vs-push/
const MAX_BLOCK_SIZE = 65_535;

function uint8ArrayToBase64(array: Uint8Array) {
  let base64;

  if (array.length < MAX_BLOCK_SIZE) {
    // Required as `btoa` and `atob` don't properly support Unicode: https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
    base64 = globalThis.btoa(String.fromCodePoint(...array));
  } else {
    base64 = '';
    for (const value of array) {
      base64 += String.fromCodePoint(value);
    }

    base64 = globalThis.btoa(base64);
  }

  return base64ToBase64Url(base64);
}

function base64ToBase64Url(base64: string) {
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

