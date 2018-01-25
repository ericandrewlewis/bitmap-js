import test from 'ava';
import m from '.';
import fs from 'fs';

test('pads data to bmp format', t => {
  const bitmap = Buffer.from([
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
  ])
  const encoded = m.encode(bitmap, 2, 2)
  const expected = Buffer.from([
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00
  ])
  t.is(0, encoded.compare(expected))
})

test('creates a bitmap file', async t => {
  const width = 1
  const height = 1
  const bitmap = m.encode(Buffer.from([0xFF, 0x00, 0xFF]), width, height)

  await m.createBitmapFile('filename.bmp', bitmap, width, height)
  const bitmapFile = await m.readBitmapFile('filename.bmp')
  t.is(0, bitmapFile.data.compare(
    bitmap
  ))
  fs.unlinkSync('filename.bmp')
})

test('creates a bitmap file', async t => {
  const width = 2
  const height = 2
  const bitmap = m.encode(Buffer.from([
    0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF
  ]), width, height)

  await m.createBitmapFile('filename-2.bmp', bitmap, width, height)
  const bitmapFile = await m.readBitmapFile('filename-2.bmp')
  t.is(0, bitmapFile.data.compare(
    bitmap
  ))
  fs.unlinkSync('filename-2.bmp')
})
