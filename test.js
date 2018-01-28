import test from 'ava';
import m from '.';
import fs from 'fs';
import util from 'util';

const readFile = util.promisify(fs.readFile)

test('converts raw bgr pixel data to padded bitmap format for 24 bits per pixel', t => {
  const unpaddedImageData = Buffer.from([
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
  ])
  const padded = m.padImageData({
    unpaddedImageData,
    width: 2,
    height: 2
  })
  const expected = Buffer.from([
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00
  ])
  t.is(0, padded.compare(expected))
})

test('converts raw bgr pixel data to padded bitmap format for 1 bit per pixel', t => {
  const unpaddedImageData = Buffer.from([
    0b10000000,
    0b01000000
  ])
  const padded = m.padImageData({
    unpaddedImageData,
    width: 2,
    height: 2
  })

  const expected = Buffer.from([
    0b10000000, 0x00, 0x00, 0x00,
    0b01000000, 0x00, 0x00, 0x00,
  ])

  t.is(0, padded.compare(expected))
})

test('creates a bitmap file header', t => {
  const fileHeader = m.bitmapFileHeader({})
  const expectedFileHeader = Buffer.from([
    'B'.charCodeAt(),
    'M'.charCodeAt(),
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
  ]);

  t.is(
    0,
    expectedFileHeader.compare(fileHeader)
  )
})

test('reads a bitmap file header', async t => {
  const width = 1
  const height = 1
  const imageData = m.padImageData({
    unpaddedImageData: Buffer.from([0xFF, 0x00, 0xFF]),
    width,
    height
  })
  const filename = 'filename-3.bmp'
  await m.createBitmapFile({
    filename,
    imageData,
    width,
    height,
    bitsPerPixel: 24
  })
  const filedata = await readFile(filename)
  const header = m.readBitmapFileHeader(filedata)
  t.is(54, header.imageDataOffset)
})

test('writes a DIB header', t => {
  const dibHeader = m.dibHeader({
    width: 300,
    height: 400,
    bitsPerPixel: 1,
    bitmapDataSize: 64
  })
  // Check a random field in the header, like the width field.
  t.is(
    300,
    dibHeader.readInt16LE(4)
  )
})

test('reads a bitmap file dib header', async t => {
  const width = 1
  const height = 1
  const imageData = m.padImageData({
    unpaddedImageData: Buffer.from([0xFF, 0x00, 0xFF]),
    width,
    height
  })
  const filename = 'filename-4.bmp'
  await m.createBitmapFile({
    filename,
    imageData,
    width,
    height,
    bitsPerPixel: 24
  })
  const filedata = await readFile(filename)
  const dibHeader = m.readDibHeader(filedata)
  t.is(1, dibHeader.height)
  t.is(0, dibHeader.numberOfColorsInPalette)
})

test('creates a 1x1 bitmap file', async t => {
  const width = 1
  const height = 1
  const imageData = m.padImageData({
    unpaddedImageData: Buffer.from([0xFF, 0x00, 0xFF]),
    width,
    height
  })

  await m.createBitmapFile({
    filename: 'filename.bmp',
    imageData,
    width,
    height,
    bitsPerPixel: 24
  })
  const bitmapFile = await m.readBitmapFile('filename.bmp')
  t.is(0, bitmapFile.imageData.compare(
    imageData
  ))
  // fs.unlinkSync('filename.bmp')
})

test('creates a 2x2 bitmap file', async t => {
  const width = 2
  const height = 2
  const imageData = m.padImageData({
    unpaddedImageData: Buffer.from([
      0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF
    ]),
    width,
    height
  })

  await m.createBitmapFile({
    filename: 'filename-2.bmp',
    imageData,
    width,
    height,
    bitsPerPixel: 24
  })
  const bitmapFile = await m.readBitmapFile('filename-2.bmp')
  t.is(0, bitmapFile.imageData.compare(
    imageData
  ))
  // fs.unlinkSync('filename-2.bmp')
})

test('creates a 2x2 bitmap file with 1 bit per pixel', async t => {
  const width = 2
  const height = 2
  const imageData = m.padImageData({
    unpaddedImageData: Buffer.from([
      0b10000000,
      0b01000000
    ]),
    width,
    height
  })
  const filename = 'filename-5.bmp'
  await m.createBitmapFile({
    filename,
    imageData,
    width,
    height,
    bitsPerPixel: 1,
    colorTable: Buffer.from([
      0xFF, 0x00, 0xFF, 0x00,
      0x00, 0xFF, 0xFF, 0x00
    ])
  })
  const bitmapFile = await m.readBitmapFile(filename)
  console.log(bitmapFile)
  t.is(0, bitmapFile.imageData.compare(
    imageData
  ))
  // fs.unlinkSync('filename-2.bmp')
})
