var fs = require('fs')

function encode(unencoded, width, height) {
  const colorValuesPerRow = unencoded.length / height
  const padding = 4 - (colorValuesPerRow % 4)
  const unencodedRowLength = colorValuesPerRow
  const encodedRowLength = colorValuesPerRow + padding
  const encoded = Buffer.alloc(encodedRowLength * height)
  for (let i = 0; i < height; i++) {
    unencoded.copy(
      encoded,
      encodedRowLength * i,
      unencodedRowLength * i,
      unencodedRowLength * i + unencodedRowLength
    )
  }
  return encoded
}

function bitmapFileHeader({filesize = 0, applicationHeader = 0, imageDataOffset = 0}) {
  const buffer = Buffer.alloc(14)
  // A bitmap file starts with a "BM" in ASCII.
  buffer.write('B', 0)
  buffer.write('M', 1)
  // The entire filesize.
  buffer.writeInt32LE(filesize, 2)
  // 4 bytes reserved for the application creating the image.
  buffer.writeInt32LE(applicationHeader, 6)
  // The byte offset to access the pixel data.
  buffer.writeInt32LE(imageDataOffset, 10)
  return buffer;
}

// Creates a DIB header, specifically a BITMAPINFOHEADER type.
function dibHeader({
  width,
  height,
  bitsPerPixel,
  bitmapDataSize
}) {
  const buffer = Buffer.alloc(40)
  // The size of the header.
  buffer.writeInt32LE(40, 0)
  // The width and height of the bitmap image.
  buffer.writeInt32LE(width, 4)
  buffer.writeInt32LE(height, 8)
  // The number of color planes, which in bitmap files is always 1
  buffer.writeInt16LE(1, 12)
  buffer.writeInt16LE(bitsPerPixel, 14)

  // Compression method, not supported in this package.
  buffer.writeInt32LE(0, 16)
  buffer.writeInt32LE(bitmapDataSize, 20)
  // The horizontal and vertical resolution of the image.
  // On monitors: 72 DPI × 39.3701 inches per metre yields 2834.6472
  buffer.writeInt32LE(2835, 24)
  buffer.writeInt32LE(2835, 28)
  // Number of colors in the palette.
  buffer.writeInt32LE(0, 32)
  // Number of important colors used.
  buffer.writeInt32LE(0, 36)
  return buffer;
}

function createBitmapFile(file, bitmap, width, height) {
  return new Promise((resolve, reject) => {
    const filesize = 54 + bitmap.length
    let fileContent = Buffer.alloc(filesize);
    let fileHeader = bitmapFileHeader({
      filesize,
      imageDataOffset: 54
    })
    fileHeader.copy(fileContent)
    dibHeader({
      width,
      height,
      bitsPerPixel: 24,
      bitmapDataSize: bitmap.length
    }).copy(fileContent, 14)

    bitmap.copy(fileContent, 54)

    fs.writeFile(file, fileContent, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function readBitmapFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, filedata) => {
      if (err) return reject(err)
      const pixelDataLength = filedata.length - 54
      const pixelData = Buffer.alloc(pixelDataLength)
      filedata.copy(pixelData, 0, 54)
      resolve({
        data: pixelData
      })
    })
  })
}

module.exports = {
  encode,
  bitmapFileHeader,
  dibHeader,
  createBitmapFile,
  readBitmapFile
}
