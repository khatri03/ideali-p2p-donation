import { deflateSync } from 'zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const crc32 = (bytes: Buffer): number => {
  let value = 0xffffffff;

  for (const byte of bytes) {
    value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return (value ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, body: Buffer): Buffer => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);

  const typed = Buffer.concat([Buffer.from(type), body]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typed));

  return Buffer.concat([length, typed, checksum]);
};

/**
 * A real PNG of whatever shape a test needs. Built rather than checked in because the framing tests
 * depend on the picture being wider than it is tall — a fixture that quietly became square would take
 * the drag out of the test without failing it.
 */
export const buildPng = (width: number, height: number): Buffer => {
  const stride = width * 3 + 1;
  const pixels = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const row = y * stride;

    for (let x = 0; x < width; x += 1) {
      pixels[row + 1 + x * 3] = (x * 4) % 256;
      pixels[row + 2 + x * 3] = (y * 8) % 256;
      pixels[row + 3 + x * 3] = 128;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/** Reads a PNG's own declared size, so a saved file can be checked without trusting any endpoint. */
export const pngSize = (png: Buffer): { width: number; height: number } => {
  if (png.length < 24 || png.subarray(0, 8).compare(SIGNATURE) !== 0) {
    throw new Error('That file is not a PNG.');
  }

  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};
