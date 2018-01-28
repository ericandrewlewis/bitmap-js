# Bitmap.js

[![Build Status](https://travis-ci.org/ericandrewlewis/bitmap-js.svg?branch=master)](https://travis-ci.org/ericandrewlewis/bitmap-js)

Read and create bitmaps in Node.js

## Read a bitmap file

```js
const { readBitmapFile } = require('bitmap-js');

const bitmapFile = await m.readBitmapFile("filename.bmp");
// { fileHeader: { filesize: 70, imageDataOffset: 62 },
//   dibHeader:
//    { headerLength: 40,
//      headerType: 'BITMAPINFOHEADER',
//      width: 2,
//      height: 2,
//      bitsPerPixel: 1,
//      compressionType: 0,
//      bitmapDataSize: 8,
//      numberOfColorsInPalette: 2,
//      numberOfImportantColors: 0 },
//   imageData: <Buffer 80 00 00 00 40 00 00 00>,
//   colorTable: <Buffer ff 00 ff 00 00 ff ff 00> }
```

Read a bitmap file to access header data, image pixel data, and the color table.

The image data is a binary representation stored in a buffer. The format of the data depends on the bits per pixel of the bitmap and any compression algorithm applied to it.

The color table is a binary representation of the colors used in the bitmap. Each color occupies four bytes in the format `BLUE GREEN RED 0x00`

## Create a 1 bit-per-pixel bitmap file

`createBitmapFile()` creates a bitmap file at a given `filename` with a few required arguments.

`imageData` is a binary `Buffer` representing the pixel array, the format of which varies depending on the number of bits-per-pixel (bpp). In a 1 bpp bitmap, each bit represents whether a pixel is the first color or the second color in the palette.

`imageData` must include padding at the end of each pixel row. Use the `padImageData()` function to avoid adding the padding manually.

```js
const { padImageData, createBitmapFile } = require('bitmap-js');

const width = 8;
const height = 6;
const colorTable = Buffer.from([
  0xFF, 0x00, 0xFF, 0x00,
  0x00, 0xFF, 0xFF, 0x00
]);

const imageData = padImageData({
  unpaddedImageData: Buffer.from([
    0b00000000,
    0b00111100,
    0b01000010,
    0b00000000,
    0b00100100,
    0b00000000
  ]),
  width,
  height
});

await createBitmapFile({
  filename: "smiley.bmp",
  imageData,
  width,
  height,
  bitsPerPixel: 1,
  colorTable
});
```

The above code generates a 6x8 bitmap like this:

![smiley](screenshots/smiley.png?raw=true)

## Create a 24 bit-per-pixel bitmap file

In a 24 bit-per-pixel bitmap file, each pixel occupies three bytes of space: one for the green, blue, and red value of the pixel.

```js
const { padImageData, createBitmapFile } = require('bitmap-js');

const width = 2;
const height = 2;

const imageData = padImageData({
  unpaddedImageData: Buffer.from([
    0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0xFF
  ]),
  width,
  height
});

await createBitmapFile({
  filename: "checkers.bmp",
  imageData,
  width,
  height,
  bitsPerPixel: 24
});
```

The above code generates a 2x2 bitmap like this:

![smiley](screenshots/checkers.png?raw=true)
